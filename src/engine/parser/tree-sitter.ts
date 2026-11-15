/**
 * The one tree-sitter parser behind both the content mapper and the runtime loader.
 * web-tree-sitter (WASM) runs the same way under Node, Bun, glibc and musl, and needs no Python.
 *
 * @module
 */
import { Language, Parser, type Tree } from 'web-tree-sitter';

import { packageFile } from '@/shared';
import { GRAMMAR_FILE } from '@/types/shared';

let parser: Parser | undefined;
let loading: Promise<Parser> | undefined;

/**
 * Loads the Python grammar. Initialization is asynchronous (WASM); parsing afterwards is not.
 * Repeated calls share one load.
 *
 * @returns The ready parser.
 */
export function loadParser(): Promise<Parser> {
	loading ??= (async () => {
		await Parser.init();

		const language = await Language.load(packageFile(GRAMMAR_FILE));
		const instance = new Parser();

		instance.setLanguage(language);
		parser = instance;

		return instance;
	})();

	return loading;
}

/**
 * Parses Python source synchronously. The caller owns the tree and must `delete()` it.
 *
 * @param source - The Python source text.
 * @returns The syntax tree.
 * @throws {Error} When {@link loadParser} has not resolved yet.
 */
export function parsePython(source: string): Tree {
	if (!parser)
		throw new Error(
			'pytongue: the Python parser is not loaded yet (await loadParser() first)',
		);

	const tree = parser.parse(source);

	if (!tree) throw new Error('pytongue: tree-sitter returned no tree');

	return tree;
}
