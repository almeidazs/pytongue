/**
 * Which Python environment a worker runs in.
 *
 * @module
 */
import { dirname, join } from 'node:path';

import { parse as parseToml } from 'smol-toml';

import type { AnalyzeHost, ModuleInfo } from '@/types/engine';
import type { EnvSpec } from '@/types/runtime';

/**
 * Decides the worker environment: the PEP 723 block, else the nearest `pyproject.toml`, else an
 * isolated environment with Pydantic only.
 *
 * @param info - The analyzed file (for its PEP 723 metadata).
 * @param file - The file's absolute path.
 * @param host - File access, for finding `pyproject.toml`.
 * @returns The environment spec.
 * @throws {Error} When the PEP 723 block is not valid TOML.
 */
export function envSpec(
	info: ModuleInfo,
	file: string,
	host: AnalyzeHost,
): EnvSpec {
	if (info.scriptMetadata !== undefined)
		return scriptEnvironment(info.scriptMetadata, file);

	for (let dir = dirname(file); ; dir = dirname(dir)) {
		if (host.fileExists(join(dir, 'pyproject.toml')))
			return { kind: 'project', root: dir };

		if (dirname(dir) === dir) break;
	}

	return { kind: 'isolated' };
}

/**
 * Reads `dependencies` and `requires-python` from a PEP 723 block.
 *
 * @param toml - The block's TOML.
 * @param file - The file, for the error message.
 * @returns The script environment.
 * @throws {Error} When the TOML is invalid.
 */
function scriptEnvironment(toml: string, file: string): EnvSpec {
	let metadata: Record<string, unknown>;

	try {
		metadata = parseToml(toml) as Record<string, unknown>;
	} catch (error) {
		throw new Error(
			`pytongue: invalid PEP 723 metadata in ${file}: ${(error as Error).message}`,
			{ cause: error },
		);
	}

	const dependencies = Array.isArray(metadata.dependencies)
		? metadata.dependencies.filter(
				(d): d is string => typeof d === 'string',
			)
		: [];
	const requiresPython = metadata['requires-python'];

	return {
		kind: 'script',
		dependencies,
		...(typeof requiresPython === 'string' && requiresPython
			? { requiresPython }
			: {}),
	};
}
