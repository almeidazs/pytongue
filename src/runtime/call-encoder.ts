/**
 * Encodes JavaScript call arguments for the worker.
 *
 * @module
 */
import type { Layout, Wire } from '@/types/runtime';

/**
 * Tells whether a value is a plain object (a keyword-arguments object), not an array or instance.
 *
 * @param value - Any value.
 * @returns `true` for `{...}` and `Object.create(null)` objects.
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
	if (typeof value !== 'object' || value === null || Array.isArray(value))
		return false;

	const proto = Object.getPrototypeOf(value);

	return proto === Object.prototype || proto === null;
}

/** Maps the arguments of one Python function's calls onto the wire format. */
export class CallEncoder {
	/**
	 * Creates an encoder.
	 *
	 * @param fn - The function name, for error messages.
	 * @param layout - The function's call layout.
	 */
	constructor(
		private readonly fn: string,
		private readonly layout: Layout,
	) {}

	/**
	 * Encodes one call.
	 *
	 * @param input - The JavaScript arguments.
	 * @returns Positional arguments, the `*args` array and keyword arguments.
	 * @throws {TypeError} On too many arguments, a non-object keyword argument, or a skipped
	 *   positional-only parameter.
	 */
	encode(input: unknown[]): Wire {
		const { layout, fn } = this;

		if (layout.generic) return { args: input, rest: null, kwargs: {} };

		const args = input.slice(0, layout.req);
		let index = layout.req;
		const optional = input.slice(index, index + layout.opt.length);

		index += layout.opt.length;

		let rest: unknown[] | null = null;

		if (layout.rest && Array.isArray(input[index]))
			rest = input[index++] as unknown[];

		let kwargs: Record<string, unknown> = {};

		if (layout.kw && input[index] !== undefined) {
			if (!isPlainObject(input[index]))
				throw new TypeError(
					`${fn}(): expected the keyword arguments object at position ${index + 1}`,
				);

			kwargs = input[index++] as Record<string, unknown>;
		}

		while (index < input.length && input[index] === undefined) index++;

		if (index < input.length)
			throw new TypeError(`${fn}(): too many arguments`);

		const given = this.givenOptionals(optional, rest !== null);

		for (let i = 0; i < args.length; i++)
			if (args[i] === undefined) args[i] = null;

		return { args: [...args, ...optional.slice(0, given)], rest, kwargs };
	}

	/**
	 * Counts the optional positionals to send. Trailing `undefined`s are dropped so Python applies
	 * its defaults; a gap before a given value cannot be expressed.
	 *
	 * @param optional - The optional positional arguments as passed.
	 * @param hasRest - Whether an `*args` array was passed.
	 * @returns How many of them to send.
	 * @throws {TypeError} On a gap, or on `*args` without every optional positional.
	 */
	private givenOptionals(optional: unknown[], hasRest: boolean): number {
		let last = optional.length - 1;

		while (last >= 0 && optional[last] === undefined) last--;

		for (let i = 0; i < last; i++)
			if (optional[i] === undefined)
				throw new TypeError(
					`${this.fn}(): cannot skip positional-only parameter \`${this.layout.opt[i]}\` when a later one is given`,
				);

		if (hasRest && last < optional.length - 1)
			throw new TypeError(
				`${this.fn}(): \`*args\` requires every positional parameter before it`,
			);

		return last + 1;
	}
}
