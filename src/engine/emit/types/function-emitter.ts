/**
 * Emits Python functions as `declare function` signatures.
 *
 * @module
 */
import type { MappedCodeBuilder } from 'ts-content-mapper';

import { propertyName, tsLocal } from '@/shared';
import {
	DEFAULT_KWARGS_NAME,
	MAPPED_FEATURES,
	type FunctionInfo,
	type Param,
	type SignatureParts,
} from '@/types/engine';

import type { DocWriter } from './doc-writer';
import type { TypeWriter } from './type-writer';

/**
 * Lays a Python signature out as TypeScript parameters: required parameters stay positional,
 * parameters with a default go into a trailing keyword-arguments object, except positional-only
 * ones, which stay optional positionals.
 *
 * @param params - The Python parameters.
 * @returns The layout.
 */
export function signatureParts(params: Param[]): SignatureParts {
	const keywordFields = params.filter(
		(p) =>
			(p.kind === 'normal' && p.hasDefault) || p.kind === 'keyword-only',
	);
	const extra = params.find((p) => p.kind === 'var-keyword');
	// The trailing object takes the `**kwargs` parameter's own name when there is one.
	const taken = new Set(
		params
			.filter((p) => p.kind !== 'var-keyword')
			.map((p) => tsLocal(p.name)),
	);
	let keywordsName = extra ? tsLocal(extra.name) : DEFAULT_KWARGS_NAME;

	while (taken.has(keywordsName)) keywordsName += '$';

	return {
		required: params.filter(
			(p) =>
				(p.kind === 'normal' || p.kind === 'positional-only') &&
				!p.hasDefault,
		),
		optionalPositional: params.filter(
			(p) => p.kind === 'positional-only' && p.hasDefault,
		),
		keywordFields,
		rest: params.find((p) => p.kind === 'var-positional'),
		extra,
		keywordsRequired: keywordFields.some(
			(p) => p.kind === 'keyword-only' && !p.hasDefault,
		),
		hasKeywords: keywordFields.length > 0 || extra !== undefined,
		keywordsName,
	};
}

/** Writes function declarations; `*args` adds an overload that takes a rest array. */
export class FunctionEmitter {
	/**
	 * Creates a function emitter.
	 *
	 * @param builder - The virtual module being built.
	 * @param types - Writes parameter and return types.
	 * @param docs - Writes docstrings and notes.
	 */
	constructor(
		private readonly builder: MappedCodeBuilder,
		private readonly types: TypeWriter,
		private readonly docs: DocWriter,
	) {}

	/**
	 * Writes one function: its JSDoc, then one or two signatures.
	 *
	 * @param info - The function.
	 */
	emit(info: FunctionInfo): void {
		const parts = signatureParts(info.params);

		this.docs.write(
			info.doc,
			this.docs.remarksFor([
				...info.params.map((p) => p.type),
				info.returns,
			]),
		);
		this.emitSignature(info, parts, false);

		if (parts.rest) this.emitSignature(info, parts, true);
	}

	/**
	 * Writes one signature.
	 *
	 * @param info - The function.
	 * @param parts - Its parameter layout.
	 * @param withRest - Whether this is the overload taking the `*args` array.
	 */
	private emitSignature(
		info: FunctionInfo,
		parts: SignatureParts,
		withRest: boolean,
	): void {
		const b = this.builder;

		b.append('declare function ')
			.appendAlias(
				tsLocal(info.name),
				info.span.start,
				info.span.end,
				MAPPED_FEATURES,
			)
			.append('(');

		const writers: (() => void)[] = [];

		for (const param of parts.required)
			writers.push(() =>
				this.emitParam(param, '', () =>
					this.types.write(param.type, true),
				),
			);

		for (const param of parts.optionalPositional) {
			// Optional unless something required follows it.
			const optional = !withRest && !parts.keywordsRequired;

			writers.push(() =>
				this.emitParam(param, optional ? '?' : '', () => {
					this.types.write(param.type, true);

					if (!optional && !withRest) b.append(' | undefined');
				}),
			);
		}

		const { rest } = parts;

		if (withRest && rest)
			writers.push(() =>
				this.emitParam(rest, '', () =>
					this.types.writeArray(rest.type, true),
				),
			);

		if (parts.hasKeywords)
			writers.push(() => {
				b.append(
					parts.keywordsName +
						(parts.keywordsRequired ? ': ' : '?: '),
				);
				this.emitKeywords(parts.keywordFields, parts.extra);
			});

		writers.forEach((write, index) => {
			if (index) b.append(', ');

			write();
		});
		b.append(info.isGenerator ? '): AsyncIterable<' : '): Promise<');
		this.types.write(info.returns, false);
		b.append('>;\n');
	}

	/**
	 * Writes `name?: type` for one parameter.
	 *
	 * @param param - The parameter.
	 * @param optional - `'?'` or `''`.
	 * @param writeType - Writes the parameter's type.
	 */
	private emitParam(
		param: Param,
		optional: string,
		writeType: () => void,
	): void {
		this.builder
			.appendAlias(
				tsLocal(param.name),
				param.span.start,
				param.span.end,
				MAPPED_FEATURES,
			)
			.append(optional + ': ');
		writeType();
	}

	/**
	 * Writes the keyword-arguments object type.
	 *
	 * @param fields - Parameters passed by keyword.
	 * @param extra - The `**kwargs` parameter, which adds an index signature.
	 */
	private emitKeywords(fields: Param[], extra: Param | undefined): void {
		const b = this.builder;

		b.append('{ ');

		for (const param of fields) {
			b.appendAlias(
				propertyName(param.name),
				param.span.start,
				param.span.end,
				MAPPED_FEATURES,
			).append(param.hasDefault ? '?: ' : ': ');
			this.types.write(param.type, true);
			b.append('; ');
		}

		if (extra) {
			// The index signature must admit every named property's type.
			b.append('[key: string]: ');

			const seen = new Set<string>();
			const members = [extra.type, ...fields.map((p) => p.type)].filter(
				(type) => {
					if (type.kind !== 'keyword') return true;

					if (seen.has(type.ts)) return false;

					seen.add(type.ts);

					return true;
				},
			);

			this.types.writeList(members, ' | ', true);
			b.append(' | undefined; ');
		}

		b.append('}');
	}
}
