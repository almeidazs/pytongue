/**
 * Analysis of the classes pytongue translates: `BaseModel`, `TypedDict` and `Enum`.
 *
 * @module
 */
import type { Node } from 'web-tree-sitter';

import { docstringOf, spanOf, stringValue, tsLocal } from '@/shared';
import type {
	ClassBases,
	ClassInfo,
	FieldInfo,
	ModelInfo,
	RefType,
} from '@/types/engine';

import type { EnumAnalyzer } from './enum-analyzer';
import type { FieldAnalyzer } from './field-analyzer';
import type { ModuleScope } from './module-scope';

/** Reads a class definition into a model, TypedDict or enum. */
export class ClassAnalyzer {
	/**
	 * Creates a class analyzer.
	 *
	 * @param scope - Decides each class's kind and resolves its bases.
	 * @param fields - Reads model and TypedDict fields.
	 * @param enums - Reads enum members.
	 */
	constructor(
		private readonly scope: ModuleScope,
		private readonly fields: FieldAnalyzer,
		private readonly enums: EnumAnalyzer,
	) {}

	/**
	 * Analyzes a top-level class.
	 *
	 * @param definition - A `class_definition` node.
	 * @returns The class, or `undefined` when pytongue does not translate it.
	 */
	analyze(definition: Node): ClassInfo | undefined {
		const nameNode = definition.childForFieldName('name')!;
		const kind = this.scope.classKind(nameNode.text);

		if (kind === 'other') return undefined;

		const body = definition.childForFieldName('body');
		const doc = docstringOf(body);

		if (kind === 'enum') return this.enums.analyze(definition, doc);

		const { bases, total } = this.bases(definition);

		return {
			kind,
			name: nameNode.text,
			span: spanOf(nameNode),
			bases,
			fields: this.fieldsOf(body, kind, total),
			...(doc ? { doc } : {}),
		} satisfies ModelInfo;
	}

	/**
	 * Reads the bases that are models or TypedDicts, and the TypedDict `total=` flag.
	 *
	 * @param definition - The `class_definition` node.
	 * @returns The base references and the `total` flag.
	 */
	private bases(definition: Node): ClassBases {
		const bases: RefType[] = [];
		let total = true;

		for (const base of definition.childForFieldName('superclasses')
			?.namedChildren ?? []) {
			if (base.type === 'keyword_argument') {
				if (
					base.childForFieldName('name')?.text === 'total' &&
					base.childForFieldName('value')?.type === 'false'
				)
					total = false;

				continue;
			}

			const resolved = this.scope.resolve(base);

			if (
				resolved.kind === 'local-class' &&
				(resolved.classKind === 'model' ||
					resolved.classKind === 'typeddict')
			)
				bases.push({
					kind: 'ref',
					path: [tsLocal(resolved.name)],
					span: spanOf(base),
				});
			else if (resolved.kind === 'relative')
				bases.push({
					kind: 'ref',
					path: resolved.path,
					span: spanOf(base),
				});
		}

		return { bases, total };
	}

	/**
	 * Reads the fields of a model or TypedDict body, field docstrings and computed fields included.
	 *
	 * @param body - The class body.
	 * @param kind - Whether the class is a model or a TypedDict.
	 * @param total - The TypedDict's `total=` flag.
	 * @returns The fields, in declaration order.
	 */
	private fieldsOf(
		body: Node | null,
		kind: 'model' | 'typeddict',
		total: boolean,
	): FieldInfo[] {
		const out: FieldInfo[] = [];
		const statements = body?.namedChildren ?? [];

		statements.forEach((statement, index) => {
			const next = statements[index + 1];
			const fieldDoc =
				next?.type === 'expression_statement' &&
				next.namedChildCount === 1
					? stringValue(next.namedChildren[0]!)
					: undefined;
			let field: FieldInfo | undefined;

			if (statement.type === 'expression_statement')
				field = this.fields.field(statement, kind, total, fieldDoc);
			else if (
				statement.type === 'decorated_definition' &&
				kind === 'model'
			)
				field = this.fields.computedField(statement);

			if (field) out.push(field);
		});

		return out;
	}
}
