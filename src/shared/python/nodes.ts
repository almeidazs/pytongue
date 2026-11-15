/**
 * Small, stateless helpers over tree-sitter Python nodes.
 *
 * @module
 */
import type { Node } from 'web-tree-sitter';

import type { Span } from '@/types/engine';
import type { SubscriptParts } from '@/types/shared';

/**
 * Builds the span of a node.
 *
 * @param node - Any node.
 * @param offset - Added to both ends; used for nodes re-parsed out of a string annotation.
 * @returns The node's span in the original source.
 */
export function spanOf(node: Node, offset = 0): Span {
	return { start: node.startIndex + offset, end: node.endIndex + offset };
}

/**
 * Splits a dotted reference into its parts.
 *
 * @param node - An `identifier`, `attribute`, `dotted_name`, `member_type` or single-child `type`.
 * @returns The parts (`['typing', 'Optional']`), or `undefined` for other nodes.
 */
export function dotted(node: Node): string[] | undefined {
	if (node.type === 'identifier') return [node.text];

	if (node.type === 'attribute') {
		const object = node.childForFieldName('object');
		const attribute = node.childForFieldName('attribute');

		if (!object || !attribute) return undefined;

		const head = dotted(object);

		return head ? [...head, attribute.text] : undefined;
	}

	if (node.type === 'dotted_name')
		return node.namedChildren.map((c) => c.text);

	if (node.type === 'member_type')
		return node.text.split('.').map((s) => s.trim());

	if (node.type === 'type' && node.namedChildCount === 1)
		return dotted(node.namedChildren[0]!);

	return undefined;
}

/**
 * Tells whether a function body yields, ignoring nested functions, lambdas and classes.
 *
 * @param node - A function body or any node inside it.
 * @returns `true` when the function is a generator.
 */
export function containsYield(node: Node): boolean {
	for (const child of node.namedChildren) {
		if (child.type === 'yield') return true;

		if (
			child.type === 'function_definition' ||
			child.type === 'lambda' ||
			child.type === 'class_definition' ||
			child.type === 'decorated_definition'
		)
			continue;

		if (containsYield(child)) return true;
	}

	return false;
}

/**
 * Unwraps a decorated definition.
 *
 * @param node - A statement node.
 * @returns The `function_definition` or `class_definition` under the decorators, or the node itself.
 */
export function definitionOf(node: Node): Node {
	return node.type === 'decorated_definition'
		? (node.childForFieldName('definition') ?? node)
		: node;
}

/**
 * Lists what each decorator refers to (`@x` and `@x(...)` both give `x`).
 *
 * @param node - A statement node.
 * @returns The decorator targets, empty when the node is not decorated.
 */
export function decoratorTargets(node: Node): Node[] {
	if (node.type !== 'decorated_definition') return [];

	return node.namedChildren
		.filter((c) => c.type === 'decorator')
		.map((decorator) => {
			const expression = decorator.namedChildren[0]!;

			return expression.type === 'call'
				? (expression.childForFieldName('function') ?? expression)
				: expression;
		});
}

/**
 * Unwraps the `type` wrapper tree-sitter puts around annotations.
 *
 * @param node - An annotation node.
 * @returns Its only child when it is a single-child `type`, or the node itself.
 */
export function innerType(node: Node): Node {
	return node.type === 'type' && node.namedChildCount === 1
		? node.namedChildren[0]!
		: node;
}

/**
 * Splits a subscripted annotation into base and arguments.
 *
 * @param node - An annotation node (`generic_type`, `subscript` or anything else).
 * @returns The base and arguments; `base` is `undefined` when the node is not subscripted.
 */
export function subscriptParts(node: Node): SubscriptParts {
	const inner = innerType(node);

	if (inner.type === 'generic_type')
		return {
			base: inner.namedChildren[0],
			args:
				inner.namedChildren.find((c) => c.type === 'type_parameter')
					?.namedChildren ?? [],
		};

	if (inner.type === 'subscript')
		return {
			base: inner.childForFieldName('value') ?? undefined,
			args: inner.childrenForFieldName('subscript'),
		};

	return { base: undefined, args: [] };
}
