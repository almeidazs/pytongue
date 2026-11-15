/**
 * Where pytongue's own files live inside the installed package.
 *
 * @module
 */

/** The tree-sitter Python grammar, relative to the package root. */
export const GRAMMAR_FILE = 'grammar/tree-sitter-python.wasm';

/**
 * How many directories up from a module the package root is searched for. Source files sit up to
 * three levels below it (`src/engine/parser/`), bundles one level (`dist/`).
 */
export const PACKAGE_SEARCH_DEPTH = 5;
