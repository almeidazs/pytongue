/**
 * Emits `import type` statements for relative Python imports.
 *
 * @module
 */
import type { MappedCodeBuilder } from 'ts-content-mapper';

import { tsLocal } from '@/shared';
import {
	MAPPED_FEATURES,
	SURFACE_PREFIX,
	type NamedImport,
	type RelativeImport,
} from '@/types/engine';

/** Writes the virtual module's imports, through the other files' `$py$` surfaces. */
export class ImportEmitter {
	/**
	 * Creates an import emitter.
	 *
	 * @param builder - The virtual module being built.
	 */
	constructor(private readonly builder: MappedCodeBuilder) {}

	/**
	 * Writes every relative import once. All of them are written, because the `$py$` surface
	 * re-exports each one, so none is unused.
	 *
	 * @param imports - The module's relative imports.
	 */
	emit(imports: RelativeImport[]): void {
		const seen = new Set<string>();
		const named = new Map<string, NamedImport[]>();

		for (const entry of imports) {
			const local = tsLocal(entry.local);

			if (seen.has(local)) continue;

			seen.add(local);

			if (entry.kind === 'named') {
				const group = named.get(entry.specifier) ?? [];

				group.push(entry);
				named.set(entry.specifier, group);
			} else {
				this.builder
					.append('import type * as ')
					.appendAlias(
						local,
						entry.span.start,
						entry.span.end,
						MAPPED_FEATURES,
					)
					.append(` from ${JSON.stringify(entry.specifier)};\n`);
			}
		}

		for (const [specifier, group] of named)
			this.emitNamed(specifier, group);
	}

	/**
	 * Writes one `import type { ... }` for all names imported from one file. Both the imported
	 * and the local name are mapped, so a missing member is reported on the Python name.
	 *
	 * @param specifier - The other file's specifier.
	 * @param group - The names imported from it.
	 */
	private emitNamed(specifier: string, group: NamedImport[]): void {
		const b = this.builder;

		b.append('import type { ');
		group.forEach((entry, index) => {
			if (index) b.append(', ');

			b.appendAlias(
				SURFACE_PREFIX + entry.imported,
				entry.importedSpan.start,
				entry.importedSpan.end,
				MAPPED_FEATURES,
			);
			b.append(' as ').appendAlias(
				tsLocal(entry.local),
				entry.span.start,
				entry.span.end,
				MAPPED_FEATURES,
			);
		});
		b.append(` } from ${JSON.stringify(specifier)};\n`);
	}
}
