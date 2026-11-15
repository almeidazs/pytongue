/**
 * Types and constants of the emitters: the virtual TypeScript module for the content mapper and
 * the JavaScript module for the runtime loader.
 *
 * @module
 */
import type { PositionEncoding } from 'ts-content-mapper';

import type { Param } from './analyze';

/** Options for emitting the virtual TypeScript module. */
export interface EmitOptions {
	/** Report every `unknown` as an error at its Python span. */
	strict: boolean;
	/** The position encoding negotiated with TypeScript. */
	positionEncoding: PositionEncoding;
}

/**
 * Language-service features mapped back to Python names: `SpanMapFeature.Hover` (1) |
 * `Definition` (8) | `TypeDefinition` (16) | `References` (64) | `DocumentHighlights` (128).
 * Rename is left out on purpose.
 *
 * Written as a literal so this module only imports types from `ts-content-mapper`: a value import
 * would pull the SDK (and vscode-jsonrpc) into every bundle that reads a constant from `@/types`.
 */
export const MAPPED_FEATURES = 1 | 8 | 16 | 64 | 128;

/** The hover note attached to declarations that use a Python `int`. */
export const INT_NOTE =
	'`int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.';

/** The first line of every virtual module, anchored at the top of the Python file. */
export const MODULE_HEADER = '/* pytongue */\n';

/** The virtual module's extension: `.mts` is always an ES module. */
export const VIRTUAL_EXTENSION = '.mts';

/** The name of the trailing keyword-arguments parameter when `**kwargs` gives none. */
export const DEFAULT_KWARGS_NAME = 'kwargs';

/** How a Python signature is laid out as TypeScript parameters. */
export interface SignatureParts {
	/** Required positional parameters. */
	required: Param[];
	/** Positional-only parameters with a default. */
	optionalPositional: Param[];
	/** Parameters that go into the trailing keyword-arguments object. */
	keywordFields: Param[];
	/** The `*args` parameter, if any. */
	rest: Param | undefined;
	/** The `**kwargs` parameter, if any. */
	extra: Param | undefined;
	/** Whether the keyword-arguments object is required (a keyword-only parameter without default). */
	keywordsRequired: boolean;
	/** Whether there is a keyword-arguments object at all. */
	hasKeywords: boolean;
	/** The TypeScript name of the keyword-arguments parameter. */
	keywordsName: string;
}
