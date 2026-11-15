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
