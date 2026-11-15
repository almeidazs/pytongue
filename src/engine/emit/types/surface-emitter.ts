/**
 * Emits the `$py$` type surface other `.py` files import through.
 *
 * @module
 */
import type { MappedCodeBuilder } from 'ts-content-mapper';

import { tsLocal } from '@/shared';
import {
	SURFACE_PREFIX,
	type SurfaceAlias,
	type SurfaceEntry,
} from '@/types/engine';

import type { TypeWriter } from './type-writer';

/** Writes `export type { X as $py$X, ... }` for every class, alias and relative import. */
export class SurfaceEmitter {
	/**
	 * Creates a surface emitter.
	 *
	 * @param builder - The virtual module being built.
	 * @param types - Writes alias types; its `unknown`s are not collected here, since they belong
	 *   to whoever imports the alias.
	 */
	constructor(
		private readonly builder: MappedCodeBuilder,
		private readonly types: TypeWriter,
	) {}

	/**
	 * Writes the surface.
	 *
	 * @param surface - The surface entries.
	 */
	emit(surface: SurfaceEntry[]): void {
		if (!surface.length) return;

		this.types.collecting = false;

		const names: string[] = [];
		let needsUnknown = false;

		for (const entry of surface) {
			const exported = SURFACE_PREFIX + entry.name;

			if (entry.kind === 'unknown') {
				needsUnknown = true;
				names.push(`$Unknown as ${exported}`);
			} else if (entry.kind === 'alias') {
				names.push(`${this.emitAlias(entry)} as ${exported}`);
			} else {
				// Classes are local declarations; relative names re-export the import binding, so a
				// missing name is reported once, at the import.
				names.push(`${tsLocal(entry.name)} as ${exported}`);
			}
		}

		if (needsUnknown)
			this.builder.append(
				'type $Unknown = unknown;\ndeclare namespace $Unknown {\n  type Input = unknown;\n}\n',
			);

		if (names.length)
			this.builder.append(`export type { ${names.join(', ')} };\n`);

		this.types.collecting = true;
	}

	/**
	 * Declares a type alias with its `.Input` shape.
	 *
	 * @param entry - The alias.
	 * @returns The local name it was declared under.
	 */
	private emitAlias(entry: SurfaceAlias): string {
		const local = `$alias$${entry.name}`;
		const input = `$aliasInput$${entry.name}`;

		this.builder.append(`type ${local} = `);
		this.types.write(entry.type, false);
		this.builder.append(`;\ntype ${input} = `);
		this.types.write(entry.type, true);
		this.builder.append(
			`;\ndeclare namespace ${local} {\n  type Input = ${input};\n}\n`,
		);

		return local;
	}
}
