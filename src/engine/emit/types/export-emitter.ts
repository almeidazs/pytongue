/**
 * Emits the virtual module's public exports.
 *
 * @module
 */
import type { MappedCodeBuilder } from 'ts-content-mapper';

import { propertyName, tsLocal } from '@/shared';
import {
	MAPPED_FEATURES,
	SURFACE_PREFIX,
	type ExportEntry,
	type PackageExport,
	type ReexportEntry,
} from '@/types/engine';

import type { DocWriter } from './doc-writer';

/** Writes `export` statements for the module's public names. */
export class ExportEmitter {
	/**
	 * Creates an export emitter.
	 *
	 * @param builder - The virtual module being built.
	 * @param docs - Writes notes on names exported as `unknown`.
	 */
	constructor(
		private readonly builder: MappedCodeBuilder,
		private readonly docs: DocWriter,
	) {}

	/**
	 * Writes the exports. Classes go into `export type` so `verbatimModuleSyntax` and
	 * `isolatedModules` projects accept them; an `export {}` is always written so the file is a module.
	 *
	 * @param exports - The public exports.
	 */
	emit(exports: ExportEntry[]): void {
		const values: string[] = [];
		const types: string[] = [];

		for (const entry of exports) {
			if (entry.kind === 'function' || entry.kind === 'class')
				(entry.kind === 'class' ? types : values).push(
					this.specifier(entry.name),
				);
			else if (entry.kind === 'reexport') this.emitReexport(entry);
			else values.push(this.emitPackageName(entry));
		}

		if (types.length)
			this.builder.append(`export type { ${types.join(', ')} };\n`);

		this.builder.append(`export { ${values.join(', ')} };\n`);
	}

	/**
	 * Spells an export specifier for a local declaration.
	 *
	 * @param name - The Python name.
	 * @returns `name`, or `$name as name` for names reserved in TypeScript.
	 */
	private specifier(name: string): string {
		const local = tsLocal(name);

		return local === name ? local : `${local} as ${name}`;
	}

	/**
	 * Writes a re-export of a name from another `.py` file.
	 *
	 * @param entry - The re-export.
	 */
	private emitReexport(entry: ReexportEntry): void {
		const b = this.builder;
		const from = ` from ${JSON.stringify(entry.specifier)};\n`;
		const alias = () =>
			b.appendAlias(
				propertyName(entry.name),
				entry.span.start,
				entry.span.end,
				MAPPED_FEATURES,
			);

		if (entry.imported === '*') {
			b.append('export * as ');
			alias();
		} else if (entry.isType === false) {
			// A function: only its public name exists in the other module.
			b.append('export { ').append(
				entry.imported === entry.name ? '' : `${entry.imported} as `,
			);
			alias();
			b.append(' }');
		} else {
			b.append(`export type { ${SURFACE_PREFIX}${entry.imported} as `);
			alias();
			b.append(' }');
		}

		b.append(from);
	}

	/**
	 * Declares a name re-exported from a package as `unknown`.
	 *
	 * @param entry - The package export.
	 * @returns Its export specifier.
	 */
	private emitPackageName(entry: PackageExport): string {
		const local = tsLocal(entry.name);

		this.docs.write(undefined, [
			`\`${entry.name}\` comes from the package \`${entry.module}\`, so it is typed as \`unknown\`.`,
		]);
		this.builder.append(`declare const ${local}: unknown;\n`);

		return this.specifier(entry.name);
	}
}
