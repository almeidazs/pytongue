/**
 * The runtime preload: turns each `.py` import into a JavaScript module whose exports forward
 * calls to a Python worker. Node uses `module.registerHooks`; Bun uses `Bun.plugin`.
 *
 * @module
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { runtimeModule } from '@/engine/emit/runtime';
import { fsHost, loadParser } from '@/engine/parser';
import { PLUGIN_NAME, PYTHON_FILE, type BunHost } from '@/types';

/**
 * The URL generated modules import `pyModule` from: the sibling `runtime.js` bundle, or
 * `src/entries/runtime.ts` when running from source.
 */
const RUNTIME_URL = import.meta.url.endsWith('.ts')
	? new URL('../entries/runtime.ts', import.meta.url).href
	: new URL('./runtime.js', import.meta.url).href;

/**
 * Generates the JavaScript module for a Python file.
 *
 * @param path - The file's absolute path.
 * @returns The module source.
 */
function buildModule(path: string): string {
	return runtimeModule(readFileSync(path, 'utf8'), path, fsHost, RUNTIME_URL);
}

/**
 * Installs the `.py` loader for the current runtime. The parser's WASM init is asynchronous and
 * the load hooks are synchronous, so the parser is loaded first.
 *
 * @returns Resolves once the hooks are installed.
 */
export async function installHooks(): Promise<void> {
	await loadParser();

	const bun = (globalThis as BunHost).Bun;

	if (bun) {
		bun.plugin({
			name: PLUGIN_NAME,
			setup(builder) {
				builder.onLoad({ filter: PYTHON_FILE }, (args) => ({
					loader: 'js',
					contents: buildModule(args.path),
				}));
			},
		});

		return;
	}

	const { registerHooks } = await import('node:module');

	registerHooks({
		load(url, context, nextLoad) {
			if (!url.startsWith('file:')) return nextLoad(url, context);

			const parsed = new URL(url);

			if (
				!PYTHON_FILE.test(parsed.pathname) ||
				parsed.search ||
				parsed.hash
			)
				return nextLoad(url, context);

			return {
				format: 'module',
				source: buildModule(fileURLToPath(parsed)),
				shortCircuit: true,
			};
		},
	});
}
