/**
 * Types and constants of the Python helpers in `src/shared/python`.
 *
 * @module
 */
import type { Node } from 'web-tree-sitter';

/** The base and the arguments of a subscripted annotation (`Base[A, B]`). */
export interface SubscriptParts {
	/** The subscripted node, if the annotation is subscripted. */
	base: Node | undefined;
	/** The arguments inside the brackets. */
	args: Node[];
}

/** Aliases folded onto one canonical name. */
export const CANONICAL_ALIASES: Readonly<Record<string, string>> = {
	'typing.List': 'builtins.list',
	'typing.Dict': 'builtins.dict',
	'typing.Set': 'builtins.set',
	'typing.FrozenSet': 'builtins.frozenset',
	'typing.Tuple': 'builtins.tuple',
	'typing.Type': 'builtins.type',
	'typing.Text': 'builtins.str',
	'typing.DefaultDict': 'builtins.dict',
	'typing.OrderedDict': 'builtins.dict',
	'typing.Deque': 'builtins.list',
	'collections.defaultdict': 'builtins.dict',
	'collections.OrderedDict': 'builtins.dict',
	'collections.deque': 'builtins.list',
};

/** Module prefixes rewritten to `typing.` (`typing_extensions.X`, `collections.abc.X`). */
export const TYPING_PREFIXES: readonly string[] = [
	'typing_extensions.',
	'collections.abc.',
];

/** Pydantic submodules whose names are re-exported from `pydantic` itself. */
export const PYDANTIC_SUBMODULES: readonly string[] = [
	'pydantic.types.',
	'pydantic.networks.',
	'pydantic.main.',
];

/** Python escape sequences with a fixed meaning. */
export const SIMPLE_ESCAPES: Readonly<Record<string, string>> = {
	'\\n': '\n',
	'\\t': '\t',
	'\\r': '\r',
	'\\\\': '\\',
	"\\'": "'",
	'\\"': '"',
	'\\0': '\0',
	'\\a': '\x07',
	'\\b': '\b',
	'\\f': '\f',
	'\\v': '\v',
};
