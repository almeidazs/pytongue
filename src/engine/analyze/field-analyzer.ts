/**
 * Analysis of `BaseModel` and `TypedDict` fields.
 *
 * @module
 */
import type { Node } from 'web-tree-sitter';

import {
	cleandoc,
	decoratorTargets,
	definitionOf,
	docstringOf,
	innerType,
	spanOf,
	stringValue,
	subscriptParts,
	unknownType,
} from '@/shared';
import {
	DiagnosticCode,
	type FieldInfo,
	type FieldOptions,
	type FieldWrappers,
} from '@/types/engine';

import type { AnnotationTranslator } from './annotation-translator';
import type { ModuleScope } from './module-scope';

/** Reads one field of a model or TypedDict body. */
export class FieldAnalyzer {
	/**
	 * Creates a field analyzer.
	 *
	 * @param scope - Resolves `Field`, `ClassVar` and the other wrappers.
	 * @param annotations - Translates field annotations.
	 */
	constructor(
		private readonly scope: ModuleScope,
		private readonly annotations: AnnotationTranslator,
	) {}

	/**
	 * Analyzes an annotated assignment in a class body.
	 *
	 * @param statement - An `expression_statement` node.
	 * @param kind - Whether the class is a model or a TypedDict.
	 * @param total - The TypedDict's `total=` flag.
	 * @param doc - The docstring that follows the field, if any.
	 * @returns The field, or `undefined` for non-fields (`ClassVar`, private names, `model_config`).
	 */
	field(
		statement: Node,
		kind: 'model' | 'typeddict',
		total: boolean,
		doc: string | undefined,
	): FieldInfo | undefined {
		const node = statement.namedChildren[0];

		if (node?.type !== 'assignment') return undefined;

		const left = node.childForFieldName('left');
		const typeNode = node.childForFieldName('type');

		if (left?.type !== 'identifier' || !typeNode) return undefined;

		const name = left.text;

		if (name.startsWith('_') || name === 'model_config') return undefined;

		const wrappers = this.wrappers(typeNode);

		if (wrappers.classVar) return undefined;

		const options = this.options(
			name,
			node.childForFieldName('right'),
			wrappers.metadata,
		);
		const fieldDoc = doc ?? options.description;
		const optional =
			kind === 'typeddict'
				? wrappers.required === undefined
					? !total
					: !wrappers.required
				: undefined;

		return {
			name,
			span: spanOf(left),
			inputName: options.inputName,
			outputName: options.outputName,
			type: this.annotations.translate(typeNode),
			optionalInput: optional ?? options.hasDefault,
			optionalOutput: optional ?? false,
			outputOnly: false,
			...(fieldDoc ? { doc: cleandoc(fieldDoc) } : {}),
		};
	}

	/**
	 * Analyzes a `@computed_field` property, which appears on output only.
	 *
	 * @param statement - A `decorated_definition` node in a model body.
	 * @returns The field, or `undefined` when the definition is not a computed field.
	 */
	computedField(statement: Node): FieldInfo | undefined {
		const isComputed = decoratorTargets(statement).some(
			(target) =>
				this.scope.qualifiedName(target) === 'pydantic.computed_field',
		);

		if (!isComputed) return undefined;

		const definition = definitionOf(statement);

		if (definition.type !== 'function_definition') return undefined;

		const nameNode = definition.childForFieldName('name')!;
		const returnNode = definition.childForFieldName('return_type');
		const type = returnNode
			? this.annotations.translate(returnNode)
			: unknownType(
					`computed field \`${nameNode.text}\` has no return type hint`,
					DiagnosticCode.MissingAnnotation,
					spanOf(nameNode),
				);
		const doc = docstringOf(definition.childForFieldName('body'));

		return {
			name: nameNode.text,
			span: spanOf(nameNode),
			inputName: nameNode.text,
			outputName: nameNode.text,
			type,
			optionalInput: true,
			optionalOutput: false,
			outputOnly: true,
			...(doc ? { doc } : {}),
		};
	}

	/**
	 * Peels the wrappers that change field semantics off an annotation.
	 *
	 * @param typeNode - The field annotation.
	 * @returns What the wrappers say.
	 */
	private wrappers(typeNode: Node): FieldWrappers {
		const result: FieldWrappers = {
			classVar: false,
			required: undefined,
			metadata: [],
		};
		let cursor: Node = typeNode;

		for (;;) {
			const { base, args } = subscriptParts(cursor);
			const qualified = this.scope.qualifiedName(base);

			if (qualified === 'typing.ClassVar')
				return { ...result, classVar: true };

			if (qualified === 'typing.Required') result.required = true;
			else if (qualified === 'typing.NotRequired')
				result.required = false;
			else if (qualified === 'typing.Annotated')
				result.metadata.push(...args.slice(1));
			else if (
				qualified !== 'typing.ReadOnly' &&
				qualified !== 'typing.Final'
			)
				break;

			if (!args[0]) break;

			cursor = args[0];
		}

		return result;
	}

	/**
	 * Reads the default value and the `Field(...)` arguments of a field.
	 *
	 * @param name - The Python attribute name.
	 * @param right - The assigned value, if any.
	 * @param metadata - `Annotated` metadata, which may hold a `Field(...)` call.
	 * @returns The names, description and default flag.
	 */
	private options(
		name: string,
		right: Node | null,
		metadata: Node[],
	): FieldOptions {
		const options: FieldOptions = {
			inputName: name,
			outputName: name,
			description: undefined,
			hasDefault: false,
		};
		const calls = metadata.map(innerType);

		if (right) {
			if (this.isFieldCall(right)) calls.push(right);
			else options.hasDefault = true;
		}

		for (const call of calls) {
			if (!this.isFieldCall(call)) continue;

			this.readFieldCall(call, call === right, options);
		}

		return options;
	}

	/**
	 * Applies the arguments of one `Field(...)` call.
	 *
	 * @param call - The `call` node.
	 * @param isAssigned - Whether the call is the assigned value (only then can it set a default).
	 * @param options - Updated in place.
	 */
	private readFieldCall(
		call: Node,
		isAssigned: boolean,
		options: FieldOptions,
	): void {
		const args = call.childForFieldName('arguments')?.namedChildren ?? [];

		args.forEach((arg, index) => {
			if (arg.type !== 'keyword_argument') {
				if (isAssigned && index === 0 && arg.type !== 'ellipsis')
					options.hasDefault = true;

				return;
			}

			const key = arg.childForFieldName('name')?.text;
			const value = arg.childForFieldName('value')!;
			const text = stringValue(value);

			if ((key === 'default' || key === 'default_factory') && isAssigned)
				options.hasDefault =
					value.type !== 'ellipsis' || key === 'default_factory';
			else if (key === 'alias' && text !== undefined)
				options.inputName = options.outputName = text;
			else if (key === 'validation_alias' && text !== undefined)
				options.inputName = text;
			else if (key === 'serialization_alias' && text !== undefined)
				options.outputName = text;
			else if (key === 'description' && text !== undefined)
				options.description = text;
		});
	}

	/**
	 * Tells whether a node is a call to `pydantic.Field`.
	 *
	 * @param node - Any node.
	 * @returns `true` for `Field(...)`.
	 */
	private isFieldCall(node: Node): boolean {
		return (
			node.type === 'call' &&
			this.scope.qualifiedName(node.childForFieldName('function')) ===
				'pydantic.Field'
		);
	}
}
