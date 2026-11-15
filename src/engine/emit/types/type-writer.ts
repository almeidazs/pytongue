/**
 * Writes translated types into the virtual module.
 *
 * @module
 */
import type { MappedCodeBuilder } from 'ts-content-mapper';

import { needsParens } from '@/shared';
import {
	MAPPED_FEATURES,
	type TypeRef,
	type UnknownType,
} from '@/types/engine';

/** Writes {@link TypeRef} values as TypeScript, mapping named types back to Python. */
export class TypeWriter {
	/** Every `unknown` written while collecting, keyed by span and reason (for strict mode). */
	readonly unknowns = new Map<string, UnknownType>();
	/** Whether written `unknown`s are collected; off for the `$py$` surface. */
	collecting = true;

	/**
	 * Creates a type writer.
	 *
	 * @param builder - The virtual module being built.
	 */
	constructor(private readonly builder: MappedCodeBuilder) {}

	/**
	 * Writes a type.
	 *
	 * @param type - The type.
	 * @param input - Whether it is an input position, where named types use their `.Input` shape.
	 */
	write(type: TypeRef, input: boolean): void {
		const b = this.builder;

		switch (type.kind) {
			case 'keyword':
				b.append(type.ts);

				return;
			case 'literal':
				b.append(
					type.values.length
						? type.values
								.map((v) =>
									v === null ? 'null' : JSON.stringify(v),
								)
								.join(' | ')
						: 'never',
				);

				return;
			case 'array':
				this.writeArray(type.element, input);

				return;
			case 'tuple':
				b.append('[');
				this.writeList(type.elements, ', ', input);
				b.append(']');

				return;
			case 'record':
				if (type.key) {
					b.append('Partial<Record<');
					this.write(type.key, input);
					b.append(', ');
				} else b.append('Record<string, ');

				this.write(type.value, input);
				b.append(type.key ? '>>' : '>');

				return;
			case 'union':
				this.writeList(type.members, ' | ', input);

				return;
			case 'ref':
				b.appendAlias(
					type.path.join('.'),
					type.span.start,
					type.span.end,
					MAPPED_FEATURES,
				);

				if (input) b.append('.Input');

				return;
			case 'unknown':
				if (this.collecting)
					this.unknowns.set(
						`${type.span.start}:${type.span.end}:${type.reason}`,
						type,
					);

				b.append('unknown');

				return;
		}
	}

	/**
	 * Writes `T[]`, parenthesizing `T` when needed.
	 *
	 * @param element - The element type.
	 * @param input - Whether it is an input position.
	 */
	writeArray(element: TypeRef, input: boolean): void {
		const paren = needsParens(element);

		if (paren) this.builder.append('(');

		this.write(element, input);
		this.builder.append(paren ? ')[]' : '[]');
	}

	/**
	 * Writes types separated by a separator.
	 *
	 * @param types - The types.
	 * @param separator - Written between them.
	 * @param input - Whether it is an input position.
	 */
	writeList(types: TypeRef[], separator: string, input: boolean): void {
		types.forEach((type, index) => {
			if (index) this.builder.append(separator);

			this.write(type, input);
		});
	}
}
