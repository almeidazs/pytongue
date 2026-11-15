/**
 * Shared test helpers: an in-memory file system, a one-call analyze-and-emit, and the package
 * build and link used by the end-to-end tests.
 *
 * @module
 */
import { existsSync, lstatSync, mkdirSync, symlinkSync } from 'node:fs';
import { join, relative } from 'node:path';

import type { TransformResult } from 'ts-content-mapper';

import { analyzePython } from '@/engine/analyze';
import { emitTypes } from '@/engine/emit/types';
import type { AnalyzeHost, ModuleInfo } from '@/types/engine';

/** The repository root. */
export const ROOT = new URL('../../', import.meta.url).pathname;

/** The file every in-memory module is analyzed as. */
export const MODULE_FILE = '/project/src/mod.py';

/** Options of {@link emitModule}. */
export interface EmitModuleOptions {
	/** Turn strict mode on. */
	strict?: boolean;
	/** Extra in-memory files, by absolute path. */
	files?: Record<string, string>;
}

/** What {@link emitModule} returns: the analysis plus the virtual module. */
export interface EmittedModule extends TransformResult {
	/** The analysis the module was emitted from. */
	info: ModuleInfo;
}

/**
 * Builds an in-memory {@link AnalyzeHost}.
 *
 * @param files - File contents by absolute path.
 * @returns A host that sees exactly these files.
 */
export function memoryHost(files: Record<string, string> = {}): AnalyzeHost {
	return {
		fileExists: (path) => path in files,
		readFile: (path) => files[path],
	};
}

/**
 * Analyzes Python source as {@link MODULE_FILE} and emits its virtual TypeScript module.
 *
 * @param source - The Python source.
 * @param options - Strict mode and extra files.
 * @returns The analysis and the transform result.
 */
export function emitModule(
	source: string,
	options: EmitModuleOptions = {},
): EmittedModule {
	const info = analyzePython(
		source,
		MODULE_FILE,
		memoryHost({ [MODULE_FILE]: source, ...options.files }),
	);

	return {
		info,
		...emitTypes(info, source, {
			strict: options.strict ?? false,
			positionEncoding: 'utf-16',
		}),
	};
}

/**
 * Collapses whitespace, so assertions do not depend on layout.
 *
 * @param text - Any text.
 * @returns The text with every whitespace run replaced by one space.
 */
export function squash(text: string): string {
	return text.replace(/\s+/g, ' ');
}

/**
 * Builds the package (`bun run build`), as the end-to-end tests run the built files.
 *
 * @throws {Error} When the build fails.
 */
export function buildPackage(): void {
	const build = Bun.spawnSync(['bun', 'run', 'build'], { cwd: ROOT });

	if (build.exitCode !== 0) throw new Error(build.stderr.toString());
}

/**
 * Gives a project `node_modules/pytongue` pointing at the repository root, as an install would.
 *
 * @param project - The project's absolute path.
 */
export function linkPackage(project: string): void {
	const modules = join(project, 'node_modules');

	mkdirSync(modules, { recursive: true });

	const target = join(modules, 'pytongue');
	let present = existsSync(target);

	try {
		present ||= lstatSync(target).isSymbolicLink();
	} catch {
		// Neither a file nor a link: create it below.
	}

	if (!present) symlinkSync(relative(modules, ROOT), target, 'dir');
}
