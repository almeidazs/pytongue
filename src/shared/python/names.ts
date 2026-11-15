/**
 * Normalization of Python qualified names and their TypeScript spelling.
 *
 * @module
 */
import {
	CANONICAL_ALIASES,
	ESCAPE_PREFIX,
	PYDANTIC_SUBMODULES,
	RESERVED_NAMES,
	TYPING_PREFIXES,
} from '@/types/shared';

/**
 * Folds equivalent spellings onto one name: `typing_extensions.X` and `collections.abc.X` become
 * `typing.X`, Pydantic submodules become `pydantic.X`, and aliases such as `typing.List` become
 * their builtin.
 *
 * @param name - A dotted qualified name.
 * @returns The canonical name.
 */
export function canonicalName(name: string): string {
	let normalized = name;

	for (const prefix of TYPING_PREFIXES)
		if (normalized.startsWith(prefix))
			normalized = 'typing.' + normalized.slice(prefix.length);

	if (PYDANTIC_SUBMODULES.some((prefix) => normalized.startsWith(prefix)))
		normalized = 'pydantic.' + normalized.split('.').at(-1);

	return CANONICAL_ALIASES[normalized] ?? normalized;
}

/**
 * Finds the top-level module of a qualified name.
 *
 * @param qualified - A dotted qualified name.
 * @returns The first segment, with `typing_extensions` counted as `typing`.
 */
export function moduleOf(qualified: string): string {
	if (qualified.startsWith('typing_extensions.')) return 'typing';

	return qualified.split('.')[0]!;
}

/**
 * Spells a Python name as a TypeScript local name.
 *
 * @param name - A Python identifier.
 * @returns The name, prefixed with `$` when it is reserved in TypeScript.
 */
export function tsLocal(name: string): string {
	return RESERVED_NAMES.has(name) ? ESCAPE_PREFIX + name : name;
}
