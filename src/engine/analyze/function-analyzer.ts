/**
 * Analysis of top-level Python functions.
 *
 * @module
 */
import type { Node } from 'web-tree-sitter';

import {
	containsYield,
	docstringOf,
	innerType,
	keywordType,
	spanOf,
	unknownType,
} from '@/shared';
import {
	DiagnosticCode,
	type FunctionInfo,
	type Param,
	type ParamKind,
	type TypeRef,
} from '@/types/engine';

import type { AnnotationTranslator } from './annotation-translator';

/** Reads the signature, return type and docstring of a function. */
export class FunctionAnalyzer {
	/**
	 * Creates a function analyzer.
	 *
	 * @param annotations - Translates parameter and return annotations.
	 */
	constructor(private readonly annotations: AnnotationTranslator) {}

	/**
	 * Analyzes a top-level `def` or `async def`.
	 *
	 * @param definition - A `function_definition` node.
	 * @returns The function's signature and docstring.
	 */
	analyze(definition: Node): FunctionInfo {
		const nameNode = definition.childForFieldName('name')!;
		const body = definition.childForFieldName('body');
		const isGenerator = body ? containsYield(body) : false;
		const doc = docstringOf(body);

		return {
			kind: 'function',
			name: nameNode.text,
			span: spanOf(nameNode),
			isAsync: definition.children.some((c) => c.type === 'async'),
			isGenerator,
			params: this.params(definition.childForFieldName('parameters')),
			returns: this.returns(definition, nameNode, isGenerator),
			...(doc ? { doc } : {}),
		};
	}

	/**
	 * Translates the return annotation.
	 *
	 * @param definition - The `function_definition` node.
	 * @param nameNode - The function name, where a missing hint is reported.
	 * @param isGenerator - Whether the function yields.
	 * @returns The return type: `void` for `-> None`, the element type for a generator.
	 */
	private returns(
		definition: Node,
		nameNode: Node,
		isGenerator: boolean,
	): TypeRef {
		const returnNode = definition.childForFieldName('return_type');

		if (!returnNode)
			return unknownType(
				isGenerator
					? 'the generator has no return type hint'
					: 'no return type hint',
				DiagnosticCode.MissingAnnotation,
				spanOf(nameNode),
			);

		if (isGenerator) return this.annotations.generatorElement(returnNode);

		if (innerType(returnNode).type === 'none') return keywordType('void');

		return this.annotations.translate(returnNode);
	}

	/**
	 * Reads the parameter list, tracking `/`, `*` and `*args` to classify each parameter.
	 *
	 * @param node - The `parameters` node.
	 * @returns The parameters, in declaration order.
	 */
	private params(node: Node | null): Param[] {
		if (!node) return [];

		const out: Param[] = [];
		let mode: ParamKind = 'normal';

		for (const parameter of node.namedChildren) {
			if (parameter.type === 'positional_separator') {
				for (const previous of out)
					if (previous.kind === 'normal')
						previous.kind = 'positional-only';

				continue;
			}

			if (parameter.type === 'keyword_separator') {
				mode = 'keyword-only';
				continue;
			}

			const param = this.param(parameter, mode);

			if (!param) continue;

			if (param.kind === 'var-positional') mode = 'keyword-only';

			out.push(param);
		}

		return out;
	}

	/**
	 * Reads one parameter.
	 *
	 * @param parameter - An `identifier`, `typed_parameter`, `default_parameter`,
	 *   `typed_default_parameter` or splat pattern node.
	 * @param mode - The kind implied by the separators seen so far.
	 * @returns The parameter, or `undefined` for patterns pytongue does not read.
	 */
	private param(parameter: Node, mode: ParamKind): Param | undefined {
		let target: Node = parameter;
		let typeNode: Node | null = null;
		let hasDefault = false;

		if (parameter.type === 'typed_parameter') {
			target = parameter.namedChildren[0]!;
			typeNode = parameter.childForFieldName('type');
		} else if (
			parameter.type === 'default_parameter' ||
			parameter.type === 'typed_default_parameter'
		) {
			target = parameter.childForFieldName('name')!;
			typeNode = parameter.childForFieldName('type');
			hasDefault = true;
		}

		let kind: ParamKind = mode;
		let nameNode: Node;

		if (target.type === 'list_splat_pattern') {
			kind = 'var-positional';
			nameNode = target.namedChildren[0] ?? target;
		} else if (target.type === 'dictionary_splat_pattern') {
			kind = 'var-keyword';
			nameNode = target.namedChildren[0] ?? target;
		} else if (target.type === 'identifier') {
			nameNode = target;
		} else {
			return undefined;
		}

		const name = nameNode.text;
		const type = typeNode
			? this.annotations.translate(typeNode)
			: unknownType(
					`parameter \`${name}\` has no type hint`,
					DiagnosticCode.MissingAnnotation,
					spanOf(nameNode),
				);

		return { name, span: spanOf(nameNode), kind, hasDefault, type };
	}
}
