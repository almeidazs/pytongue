/**
 * Syntax errors reported by tree-sitter.
 *
 * @module
 */
import type { Node } from 'web-tree-sitter';

import { spanOf } from '@/shared';
import { MAX_SYNTAX_ERRORS, type SyntaxErrorInfo } from '@/types/engine';

/**
 * Collects the syntax errors under a node: missing tokens and `ERROR` nodes.
 *
 * @param node - Usually the module root.
 * @param out - Receives the errors; at most {@link MAX_SYNTAX_ERRORS} are collected.
 * @returns The same `out` array.
 */
export function collectSyntaxErrors(
	node: Node,
	out: SyntaxErrorInfo[] = [],
): SyntaxErrorInfo[] {
	if (out.length >= MAX_SYNTAX_ERRORS) return out;

	if (node.isMissing) {
		out.push({
			span: spanOf(node),
			message: `Python syntax error: missing ${node.type}`,
		});

		return out;
	}

	if (node.type === 'ERROR') {
		out.push({ span: spanOf(node), message: 'Python syntax error' });

		return out;
	}

	if (!node.hasError) return out;

	for (const child of node.children) collectSyntaxErrors(child, out);

	return out;
}

/**
 * Reports the indentation errors Python's tokenizer raises and tree-sitter's scanner accepts:
 * an unexpected indent, a block with no body, and a dedent to a level no enclosing block has.
 *
 * @param root - The module root.
 * @param out - Receives the errors; at most {@link MAX_SYNTAX_ERRORS} are kept in total.
 * @returns The same `out` array.
 */
export function collectIndentationErrors(
	root: Node,
	out: SyntaxErrorInfo[],
): SyntaxErrorInfo[] {
	checkStatements(root.namedChildren, 0, undefined, out);

	for (const block of root.descendantsOfType('block')) checkBlock(block, out);

	return out;
}

/**
 * Checks one block: it must have a body, indented deeper than its header, and every statement
 * that starts a line must sit at the same column.
 *
 * @param block - A `block` node.
 * @param out - Receives the errors.
 */
function checkBlock(block: Node, out: SyntaxErrorInfo[]): void {
	const statements = block.namedChildren.filter((n) => n.type !== 'comment');
	const colon = block.previousSibling;
	const header = block.parent;

	if (!statements.length) {
		// `def f():` followed by a line at the same indentation: tree-sitter makes an empty block.
		if (colon) report(out, spanOf(colon), 'expected an indented block');

		return;
	}

	const first = statements[0]!;
	const inline =
		colon !== null && first.startPosition.row === colon.endPosition.row;
	const baseline = inline ? undefined : first.startPosition.column;

	if (
		!inline &&
		header &&
		first.startPosition.column <= header.startPosition.column
	)
		report(out, indentSpan(first), 'expected an indented block');

	checkStatements(statements, baseline, first, out);
}

/**
 * Checks that the statements of a module or block that start a line share one column.
 *
 * @param statements - Its statements (comments excluded).
 * @param baseline - The column they must start at; `undefined` when the first is inline.
 * @param skip - A statement already checked by the caller.
 * @param out - Receives the errors.
 */
function checkStatements(
	statements: Node[],
	baseline: number | undefined,
	skip: Node | undefined,
	out: SyntaxErrorInfo[],
): void {
	const own = statements.filter((n) => n.type !== 'comment');

	own.forEach((statement, index) => {
		const previous = own[index - 1];
		const startsLine =
			!previous || statement.startPosition.row > previous.endPosition.row;

		if (!startsLine || statement === skip || baseline === undefined) return;

		const column = statement.startPosition.column;

		if (column === baseline) return;

		// A later statement indented deeper than its block, right after a nested block that
		// ended, is a dedent to a level that does not exist; after a plain statement it is just
		// an unexpected indent.
		const afterBlock = previous?.descendantsOfType('block').length;

		report(
			out,
			indentSpan(statement),
			column > baseline && !afterBlock
				? 'unexpected indent'
				: 'unindent does not match any outer indentation level',
		);
	});
}

/**
 * The span of a statement's leading whitespace, or its first character when it has none.
 *
 * @param node - A statement.
 * @returns The span to report.
 */
function indentSpan(node: Node): { start: number; end: number } {
	const column = node.startPosition.column;

	return column > 0
		? { start: node.startIndex - column, end: node.startIndex }
		: { start: node.startIndex, end: node.startIndex + 1 };
}

/**
 * Adds one indentation error, unless the cap is reached.
 *
 * @param out - Receives the error.
 * @param span - Where it is.
 * @param reason - What is wrong.
 */
function report(
	out: SyntaxErrorInfo[],
	span: { start: number; end: number },
	reason: string,
): void {
	if (out.length >= MAX_SYNTAX_ERRORS) return;

	out.push({ span, message: `Python syntax error: ${reason}` });
}
