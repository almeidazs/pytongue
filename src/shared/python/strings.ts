/**
 * Reading Python literals and docstrings from the syntax tree.
 *
 * @module
 */
import type { Node } from 'web-tree-sitter';

import type { LiteralValue } from '@/types/engine';
import { SIMPLE_ESCAPES } from '@/types/shared';

/**
 * Reads the value of a plain Python string literal, implicit concatenation included.
 *
 * @param node - A `string` or `concatenated_string` node.
 * @returns The decoded value, or `undefined` for f-strings, t-strings, bytes and other nodes.
 */
export function stringValue(node: Node): string | undefined {
	if (node.type === 'concatenated_string') {
		let value = '';

		for (const part of node.namedChildren) {
			const piece = stringValue(part);

			if (piece === undefined) return undefined;

			value += piece;
		}

		return value;
	}

	if (node.type !== 'string') return undefined;

	const start = node.namedChildren.find((c) => c.type === 'string_start');
	const prefix = (start?.text ?? '').replace(/["']/g, '').toLowerCase();

	if (prefix.includes('f') || prefix.includes('b') || prefix.includes('t'))
		return undefined;

	if (prefix.includes('r')) {
		// A raw string has no escapes to process, and tree-sitter may give it no content nodes
		// at all (`r'\''`): the text between the delimiters is the value.
		const end = node.namedChildren.find((c) => c.type === 'string_end');

		return node.text.slice(
			start?.text.length ?? 0,
			node.text.length - (end?.text.length ?? 0),
		);
	}

	let value = '';

	for (const child of node.namedChildren) {
		if (child.type === 'string_content') {
			const text = unescapeContent(child);

			if (text === undefined) return undefined;

			value += text;
		} else if (child.type === 'interpolation') return undefined;
	}

	return value;
}

/**
 * Decodes the escape sequences inside one `string_content` node.
 *
 * @param content - A `string_content` node.
 * @returns The decoded text, or `undefined` when it holds an escape that cannot be decoded.
 */
function unescapeContent(content: Node): string | undefined {
	let out = '';
	let position = content.startIndex;
	const text = content.text;
	const base = content.startIndex;

	for (const escape of content.namedChildren) {
		if (escape.type !== 'escape_sequence') continue;

		const decoded = decodeEscape(escape.text);

		if (decoded === undefined) return undefined;

		out += text.slice(position - base, escape.startIndex - base);
		out += decoded;
		position = escape.endIndex;
	}

	out += text.slice(position - base);

	return out;
}

/**
 * Decodes one Python escape sequence.
 *
 * @param escape - The escape as written, such as `\n` or `\x41`.
 * @returns The character it stands for, the escape itself when Python keeps it, or `undefined`
 *   for `\N{name}`, which needs a Unicode name table JavaScript does not have.
 */
function decodeEscape(escape: string): string | undefined {
	if (escape.startsWith('\\N{')) return undefined;

	const simple = SIMPLE_ESCAPES[escape];

	if (simple !== undefined) return simple;

	if (
		/^\\x[0-9a-fA-F]{2}$/.test(escape) ||
		/^\\u[0-9a-fA-F]{4}$/.test(escape) ||
		/^\\U[0-9a-fA-F]{8}$/.test(escape)
	)
		return String.fromCodePoint(parseInt(escape.slice(2), 16));

	if (/^\\[0-7]{1,3}$/.test(escape))
		return String.fromCodePoint(parseInt(escape.slice(1), 8));

	if (escape.startsWith('\\\n')) return '';

	return escape;
}

/**
 * Normalizes a docstring the way `inspect.cleandoc` does.
 *
 * @param doc - The raw docstring.
 * @returns The docstring with common indentation and surrounding blank lines removed.
 */
export function cleandoc(doc: string): string {
	const lines = doc.replace(/\t/g, '        ').split('\n');
	let indent = Infinity;

	for (const line of lines.slice(1)) {
		const stripped = line.trimStart();

		if (stripped) indent = Math.min(indent, line.length - stripped.length);
	}

	const out = [
		lines[0]!.trim(),
		...lines
			.slice(1)
			.map((l) => (indent === Infinity ? l : l.slice(indent)).trimEnd()),
	];

	while (out.length && !out[0]) out.shift();

	while (out.length && !out.at(-1)) out.pop();

	return out.join('\n');
}

/**
 * Reads the docstring of a function or class body.
 *
 * @param block - The body `block` node.
 * @returns The cleaned docstring, or `undefined` when the body does not start with one.
 */
export function docstringOf(block: Node | null): string | undefined {
	const first = block?.namedChildren[0];

	if (
		!first ||
		first.type !== 'expression_statement' ||
		first.namedChildCount !== 1
	)
		return undefined;

	const value = stringValue(first.namedChildren[0]!);

	return value === undefined ? undefined : cleandoc(value) || undefined;
}

/**
 * Reads a literal usable in `typing.Literal[...]` or as an enum value.
 *
 * @param node - A string, number, boolean, `None` or negated number node.
 * @returns The value, or `undefined` when the node is not such a literal.
 */
export function literalValue(node: Node): LiteralValue | undefined {
	switch (node.type) {
		case 'string':
		case 'concatenated_string':
			return stringValue(node);

		case 'integer': {
			const n = Number(node.text.replace(/_/g, '').replace(/[lL]$/, ''));

			return Number.isNaN(n) ? undefined : n;
		}

		case 'float': {
			const n = Number(node.text.replace(/_/g, ''));

			return Number.isNaN(n) ? undefined : n;
		}

		case 'true':
			return true;
		case 'false':
			return false;
		case 'none':
			return null;

		case 'unary_operator': {
			const argument = node.childForFieldName('argument');
			const operator =
				node.childForFieldName('operator')?.text ?? node.text.trim()[0];
			const value = argument ? literalValue(argument) : undefined;

			if (typeof value !== 'number') return undefined;

			if (operator === '-') return -value;

			return operator === '+' ? value : undefined;
		}
	}

	return undefined;
}
