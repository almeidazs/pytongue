/**
 * fast-check arbitraries that generate valid Python function definitions together with a call
 * for each, built from the TypeScript signature pytongue emits, and the result Python must give.
 *
 * @module
 */
import * as fc from 'fast-check';

/** How a generated parameter is declared. */
export type ParamShape =
	| 'required'
	| 'default'
	| 'posonly'
	| 'posonly-default'
	| 'kwonly'
	| 'kwonly-default'
	| 'varargs'
	| 'varkw';

/** One generated parameter. */
export interface GenParam {
	/** The Python name. */
	name: string;
	/** How it is declared. */
	shape: ParamShape;
	/** The Python annotation. */
	annotation: string;
	/** A value that matches the annotation, written as JSON. */
	value: unknown;
	/** The value used when the parameter has a default. */
	fallback: unknown;
}

/** A generated function with a call and the result it must produce. */
export interface GenFunction {
	/** The function name. */
	name: string;
	/** Whether it is `async def`. */
	isAsync: boolean;
	/** The parameters, in declaration order. */
	params: GenParam[];
	/** The Python source of the function. */
	source: string;
	/** The JavaScript arguments of a call that TypeScript accepts for the emitted signature. */
	args: unknown[];
	/** What the function must return for that call. */
	expected: Record<string, unknown>;
}

interface TypedValue {
	annotation: string;
	value: unknown;
	fallback: unknown;
	literal: string;
}

const typedValue: fc.Arbitrary<TypedValue> = fc.oneof(
	fc.integer({ min: -1000, max: 1000 }).map((n) => ({
		annotation: 'int',
		value: n,
		fallback: 7,
		literal: '7',
	})),
	fc.string({ maxLength: 8 }).map((s) => ({
		annotation: 'str',
		value: s,
		fallback: 'd',
		literal: '"d"',
	})),
	fc.boolean().map((b) => ({
		annotation: 'bool',
		value: b,
		fallback: true,
		literal: 'True',
	})),
	fc.array(fc.integer({ min: 0, max: 99 }), { maxLength: 4 }).map((a) => ({
		annotation: 'list[int]',
		value: a,
		fallback: [1],
		literal: '[1]',
	})),
	fc.option(fc.integer({ min: 0, max: 9 }), { nil: null }).map((n) => ({
		annotation: 'int | None',
		value: n,
		fallback: null,
		literal: 'None',
	})),
	fc.constantFrom('a', 'b', 'c').map((s) => ({
		annotation: 'Literal["a", "b", "c"]',
		value: s,
		fallback: 'a',
		literal: '"a"',
	})),
);

/** Python identifiers a generated parameter or function may use (no keywords, no collisions). */
const NAMES = [
	'alpha',
	'beta',
	'gamma',
	'delta',
	'eps',
	'zeta',
	'eta',
	'theta',
];

/**
 * Generates the parameter shapes of one function, in an order Python accepts: positional-only,
 * normal, `*args` or a bare `*`, keyword-only, `**kwargs`.
 *
 * @returns An arbitrary of shape lists.
 */
function shapes(): fc.Arbitrary<ParamShape[]> {
	return fc
		.record({
			posonly: fc.array(
				fc.constantFrom<ParamShape>('posonly', 'posonly-default'),
				{
					maxLength: 2,
				},
			),
			normal: fc.array(
				fc.constantFrom<ParamShape>('required', 'default'),
				{
					maxLength: 3,
				},
			),
			varargs: fc.boolean(),
			kwonly: fc.array(
				fc.constantFrom<ParamShape>('kwonly', 'kwonly-default'),
				{
					maxLength: 3,
				},
			),
			varkw: fc.boolean(),
		})
		.map(({ posonly, normal, varargs, kwonly, varkw }) => {
			// A default may not be followed by a parameter without one, among positionals.
			const positional = posonly.concat(normal);
			const firstDefault = positional.findIndex((s) =>
				s.endsWith('default'),
			);
			const fixed = positional.map((shape, i): ParamShape => {
				if (firstDefault === -1 || i <= firstDefault) return shape;

				if (shape === 'posonly') return 'posonly-default';

				return shape === 'required' ? 'default' : shape;
			});
			const varargsShape: ParamShape[] = varargs ? ['varargs'] : [];
			const varkwShape: ParamShape[] = varkw ? ['varkw'] : [];

			return fixed.concat(varargsShape, kwonly, varkwShape);
		})
		.filter((list) => list.length > 0 && list.length <= NAMES.length);
}

/**
 * Builds the Python source and the matching call for a list of shapes.
 *
 * @param name - The function name.
 * @param isAsync - Whether it is `async def`.
 * @param list - The parameter shapes.
 * @param values - A typed value per parameter.
 * @param provide - Which defaulted parameters the call provides.
 * @returns The generated function.
 */
function build(
	name: string,
	isAsync: boolean,
	list: ParamShape[],
	values: TypedValue[],
	provide: boolean[],
): GenFunction {
	const params: GenParam[] = list.map((shape, i) => ({
		name: NAMES[i]!,
		shape,
		annotation:
			shape === 'varkw' || shape === 'varargs'
				? 'int'
				: values[i]!.annotation,
		value:
			shape === 'varkw' || shape === 'varargs' ? 3 + i : values[i]!.value,
		fallback: values[i]!.fallback,
	}));

	const varargs = params.find((p) => p.shape === 'varargs');
	// With `*args`, a normal parameter with a default stays positional: Python can only reach
	// `*args` by position.
	const isOptionalPositional = (p: GenParam) =>
		p.shape === 'posonly-default' ||
		(varargs !== undefined && p.shape === 'default');
	const positional = params.filter(
		(p) =>
			p.shape === 'required' ||
			p.shape === 'posonly' ||
			isOptionalPositional(p),
	);
	const posonly = params.filter((p) => p.shape.startsWith('posonly'));
	const header: string[] = [];

	params.forEach((p, i) => {
		if (p.shape === 'varargs') header.push(`*${p.name}: int`);
		else if (p.shape === 'varkw') header.push(`**${p.name}: int`);
		else if (p.shape.endsWith('default'))
			header.push(`${p.name}: ${p.annotation} = ${values[i]!.literal}`);
		else header.push(`${p.name}: ${p.annotation}`);

		if (posonly.length && p === posonly.at(-1)) header.push('/');

		const next = params[i + 1];

		// A bare `*` starts the keyword-only parameters when there is no `*args`.
		if (
			!varargs &&
			next?.shape.startsWith('kwonly') &&
			!p.shape.startsWith('kwonly')
		)
			header.push('*');
	});

	if (!varargs && params[0]?.shape.startsWith('kwonly')) header.unshift('*');

	const fields = params.map((p) => {
		if (p.shape === 'varargs') return `"${p.name}": list(${p.name})`;

		return `"${p.name}": ${p.name}`;
	});
	const source = [
		`${isAsync ? 'async ' : ''}def ${name}(${header.join(', ')}) -> dict[str, object]:`,
		`    return {${fields.join(', ')}}`,
	].join('\n');

	// The call: positionals in order (optional ones only while provided), the `*args` array, then
	// the keyword object. TypeScript requires each optional positional before a later one.
	const args: unknown[] = [];
	const expected: Record<string, unknown> = {};
	let omitted = 0;
	let positionalOpen = true;
	let allOptionalGiven = true;

	for (const p of positional) {
		const index = params.indexOf(p);
		const defaulted = isOptionalPositional(p);
		const given = !defaulted || (positionalOpen && provide[index]);

		if (defaulted && !given) positionalOpen = false;

		if (given) {
			args.push(p.value);
			expected[p.name] = p.value;
		} else {
			allOptionalGiven = false;
			expected[p.name] = p.fallback;
			omitted++;
		}
	}

	const keywords: Record<string, unknown> = {};

	if (varargs) {
		// `*args` can only follow when every positional was passed.
		const rest = allOptionalGiven ? [varargs.value, 5] : [];

		if (rest.length) args.push(rest);

		expected[varargs.name] = rest;
	}

	// Parameters with a default go into the keyword object, whether or not they are keyword-only.
	for (const p of params) {
		const index = params.indexOf(p);
		const isKwOnly = p.shape.startsWith('kwonly');
		const isNormalDefault = p.shape === 'default' && !varargs;

		if (!isKwOnly && !isNormalDefault) continue;

		const defaulted = p.shape.endsWith('default');

		if (!defaulted || provide[index]) {
			keywords[p.name] = p.value;
			expected[p.name] = p.value;
		} else {
			expected[p.name] = p.fallback;
		}
	}

	const varkw = params.find((p) => p.shape === 'varkw');

	if (varkw) {
		keywords.extra_one = 11;
		keywords.extra_two = 12;
		expected[varkw.name] = { extra_one: 11, extra_two: 12 };
	}

	// Passing the keyword object means filling the optional positional slots before it.
	if (Object.keys(keywords).length) {
		for (let i = 0; i < omitted; i++) args.push(undefined);

		args.push(keywords);
	}

	return { name, isAsync, params, source, args, expected };
}

/**
 * Normal parameters with a default are passed in the keyword object, so a normal default that the
 * call omits must not be followed by a positional that is passed: the arbitrary only produces
 * calls where the omitted ones come last, which is what `positionalOpen` enforces above.
 *
 * @returns An arbitrary of generated functions.
 */
export function genFunction(): fc.Arbitrary<GenFunction> {
	return fc
		.record({
			isAsync: fc.boolean(),
			list: shapes(),
		})
		.chain(({ isAsync, list }) =>
			fc
				.tuple(
					fc.array(typedValue, {
						minLength: list.length,
						maxLength: list.length,
					}),
					fc.array(fc.boolean(), {
						minLength: list.length,
						maxLength: list.length,
					}),
				)
				.map(([values, provide]) =>
					build('fn', isAsync, list, values, provide),
				),
		);
}

/**
 * Generates a module of several uniquely named functions.
 *
 * @param max - The most functions in the module.
 * @returns An arbitrary of functions with unique names (`fn0`, `fn1`, …).
 */
export function genModule(max = 8): fc.Arbitrary<GenFunction[]> {
	return fc
		.array(genFunction(), { minLength: 1, maxLength: max })
		.map((functions) =>
			functions.map((fn, index): GenFunction => {
				const name = `fn${index}`;

				return {
					name,
					isAsync: fn.isAsync,
					params: fn.params,
					source: fn.source.replace('def fn(', `def ${name}(`),
					args: fn.args,
					expected: fn.expected,
				};
			}),
		);
}

/**
 * Wraps generated functions in a Python module.
 *
 * @param functions - The functions.
 * @returns The module source.
 */
export function moduleSource(functions: GenFunction[]): string {
	return [
		'from typing import Literal',
		'',
		'',
		...functions.flatMap((fn) => [fn.source, '', '']),
	].join('\n');
}
