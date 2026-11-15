/**
 * Locates pytongue's own files (the grammar, the Python worker) from any module, whether it runs
 * from source (`src/engine/parser/...`) or from a bundle (`dist/...`).
 *
 * @module
 */
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PACKAGE_SEARCH_DEPTH } from '@/types/shared';

const resolved = new Map<string, string>();

/**
 * Finds a file of the pytongue package by walking up from this module.
 *
 * @param relativePath - The file's path relative to the package root, such as `python/bridge.py`.
 * @returns The absolute path of the file.
 * @throws {Error} When the file is not found within {@link PACKAGE_SEARCH_DEPTH} levels.
 */
export function packageFile(relativePath: string): string {
	const cached = resolved.get(relativePath);

	if (cached) return cached;

	let dir = dirname(fileURLToPath(import.meta.url));

	for (let level = 0; level <= PACKAGE_SEARCH_DEPTH; level++) {
		const candidate = join(dir, relativePath);

		if (existsSync(candidate)) {
			resolved.set(relativePath, candidate);

			return candidate;
		}

		dir = dirname(dir);
	}

	throw new Error(`pytongue: cannot find ${relativePath} in the package`);
}
