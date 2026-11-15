import { copyFile, mkdir, rm } from 'node:fs/promises';

import { defineConfig } from 'tsdown';

/** Entry points, by output name: `dist/<name>.js`. */
const entry = {
	mapper: 'src/entries/mapper.ts',
	register: 'src/entries/register.ts',
	runtime: 'src/entries/runtime.ts',
};

/** Pure JS dependencies inlined into the bundles (also the only ones allowed in). */
const bundled = ['ts-content-mapper', 'vscode-jsonrpc', 'smol-toml'];

export default defineConfig({
	entry,
	outDir: 'dist',
	format: 'esm',
	platform: 'node',
	target: 'node24',
	// `.js`, not `.mjs`: the preload loads `./runtime.js` by name, and package.json points at `.js`.
	fixedExtension: false,
	// Minification also strips every comment from the JavaScript.
	minify: true,
	treeshake: true,
	sourcemap: false,
	clean: true,
	deps: {
		// Fewer files to resolve at startup and nothing to install. web-tree-sitter stays external
		// because it loads its own .wasm next to its module.
		alwaysBundle: bundled,
		// Fails the build if anything else ends up in the bundle.
		onlyBundle: bundled,
	},
	// Declarations through TypeScript 7 (tsgo). Only runtime.d.ts is public; it keeps its JSDoc.
	dts: { tsgo: {} },
	hooks: {
		// grammar/ sits next to dist/; package-files.ts finds it from source and from bundles.
		'build:prepare': async () => {
			await mkdir('grammar', { recursive: true });
			await copyFile(
				'node_modules/tree-sitter-python/tree-sitter-python.wasm',
				'grammar/tree-sitter-python.wasm',
			);
		},
		// The mapper and the preload have no public types.
		'build:done': async () => {
			await rm('dist/mapper.d.ts', { force: true });
			await rm('dist/register.d.ts', { force: true });
		},
	},
});
