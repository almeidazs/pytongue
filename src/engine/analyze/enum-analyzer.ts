/**
 * Analysis of `Enum` subclasses.
 *
 * @module
 */
import type { Node } from 'web-tree-sitter';

import { keywordType, literalValue, spanOf, unknownType } from '@/shared';
import {
	DiagnosticCode,
	type EnumInfo,
	type EnumMember,
	type LiteralValue,
	type TypeRef,
} from '@/types/engine';

import type { ModuleScope } from './module-scope';

/** Reads the member values of an enum, which is what crosses into JSON. */
export class EnumAnalyzer {
	/**
	 * Creates an enum analyzer.
	 *
	 * @param scope - Resolves the enum bases and `auto()`.
	 */
	constructor(private readonly scope: ModuleScope) {}

	/**
	 * Analyzes an enum class.
	 *
	 * @param definition - The `class_definition` node.
	 * @param doc - The class docstring, if any.
	 * @returns The enum as a literal union of its values, or `unknown` when a value is not static.
	 */
	analyze(definition: Node, doc: string | undefined): EnumInfo {
		const nameNode = definition.childForFieldName('name')!;
		const bases =
			definition.childForFieldName('superclasses')?.namedChildren ?? [];
		const strEnum = bases.some(
			(b) => this.scope.qualifiedName(b) === 'enum.StrEnum',
		);
		const values: LiteralValue[] = [];
		let unreadable: string | undefined;
		let lastInt = 0;

		for (const statement of definition.childForFieldName('body')
			?.namedChildren ?? []) {
			const member = this.member(statement);

			if (!member) continue;

			const value = literalValue(member.value);

			if (value !== undefined) {
				values.push(value);

				if (typeof value === 'number') lastInt = value;

				continue;
			}

			if (this.isAuto(member.value)) {
				values.push(strEnum ? member.name.toLowerCase() : ++lastInt);
				continue;
			}

			unreadable = `enum member \`${member.name}\` has a value pytongue cannot read statically`;
		}

		return {
			kind: 'enum',
			name: nameNode.text,
			span: spanOf(nameNode),
			type: this.enumType(values, unreadable, nameNode),
			...(doc ? { doc } : {}),
		};
	}

	/**
	 * Reads a member assignment (`NAME = value`) from a class-body statement.
	 *
	 * @param statement - A statement of the enum body.
	 * @returns The member name and value node, or `undefined` for anything else.
	 */
	private member(statement: Node): EnumMember | undefined {
		const node =
			statement.type === 'expression_statement'
				? statement.namedChildren[0]
				: undefined;

		if (node?.type !== 'assignment' || node.childForFieldName('type'))
			return undefined;

		const left = node.childForFieldName('left');
		const right = node.childForFieldName('right');

		if (left?.type !== 'identifier' || !right || left.text.startsWith('_'))
			return undefined;

		return { name: left.text, value: right };
	}

	/**
	 * Tells whether a value is a call to `enum.auto()`.
	 *
	 * @param value - A member value node.
	 * @returns `true` for `auto()`.
	 */
	private isAuto(value: Node): boolean {
		return (
			value.type === 'call' &&
			this.scope.qualifiedName(value.childForFieldName('function')) ===
				'enum.auto'
		);
	}

	/**
	 * Builds the enum's type.
	 *
	 * @param values - The member values read so far.
	 * @param unreadable - Why a member could not be read, if one could not.
	 * @param nameNode - The class name, where an unreadable value is reported.
	 * @returns A literal union, `unknown` with a reason, or plain `unknown` for an empty enum.
	 */
	private enumType(
		values: LiteralValue[],
		unreadable: string | undefined,
		nameNode: Node,
	): TypeRef {
		if (unreadable)
			return unknownType(
				unreadable,
				DiagnosticCode.Untranslatable,
				spanOf(nameNode),
			);

		return values.length
			? { kind: 'literal', values }
			: keywordType('unknown');
	}
}
