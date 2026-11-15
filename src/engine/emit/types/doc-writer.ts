/**
 * Writes JSDoc comments into the virtual module: Python docstrings plus pytongue's hover notes.
 *
 * @module
 */
import type { MappedCodeBuilder } from 'ts-content-mapper';

import { walkType } from '@/shared';
import { INT_NOTE, type TypeRef } from '@/types/engine';

/** Writes JSDoc for declarations. */
export class DocWriter {
	/**
	 * Creates a doc writer.
	 *
	 * @param builder - The virtual module being built.
	 * @param moduleNotes - Notes shown on every declaration of the module.
	 */
	constructor(
		private readonly builder: MappedCodeBuilder,
		private readonly moduleNotes: readonly string[],
	) {}

	/**
	 * Writes a JSDoc block, or nothing when there is nothing to say.
	 *
	 * @param text - The docstring, if any.
	 * @param remarks - pytongue notes, written as `@remarks` (duplicates removed).
	 */
	write(text: string | undefined, remarks: string[]): void {
		const lines = text ? text.split('\n') : [];
		const unique = [...new Set(remarks)];

		if (unique.length) {
			if (lines.length) lines.push('');

			for (const remark of unique)
				lines.push(`@remarks pytongue: ${remark}`);
		}

		if (!lines.length) return;

		const body = lines
			.map((l) => ` * ${l.replace(/\*\//g, '*\\/')}`.trimEnd())
			.join('\n');

		this.builder.append(`/**\n${body}\n */\n`);
	}

	/**
	 * Collects the notes a declaration needs: why types are `unknown`, the `int` precision note,
	 * and the module notes.
	 *
	 * @param types - The types the declaration uses.
	 * @returns The notes, in order.
	 */
	remarksFor(types: TypeRef[]): string[] {
		const out: string[] = [];
		let usesInt = false;

		for (const type of types)
			walkType(type, (t) => {
				if (t.kind === 'unknown')
					out.push(`${t.reason}, so it is typed as \`unknown\`.`);

				if (t.kind === 'keyword' && t.int) usesInt = true;
			});

		if (usesInt) out.push(INT_NOTE);

		return [...out, ...this.moduleNotes.map((note) => note + '.')];
	}
}
