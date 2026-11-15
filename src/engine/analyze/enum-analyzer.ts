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
	type AutoKind,
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
		const kind = this.autoKind(bases);
		const values: LiteralValue[] = [];
		let unreadable: string | undefined;
		let highest = 0;

		for (const statement of definition.childForFieldName('body')
			?.namedChildren ?? []) {
			const member = this.member(statement);

			if (!member) continue;

			const value = literalValue(member.value);

			if (value !== undefined) {
				values.push(value);

				if (typeof value === 'number')
					highest = Math.max(highest, value);

				continue;
			}

			if (this.isAuto(member.value)) {
				const next = nextAuto(kind, member.name, highest);

				if (typeof next === 'number') highest = next;

				values.push(kind === 'string-mixin' ? String(next) : next);

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
	 * Decides how `auto()` numbers or names members, from the enum's bases.
	 *
	 * @param bases - The class's base expressions.
	 * @returns The flavour of `auto()` this enum uses.
	 */
	private autoKind(bases: Node[]): AutoKind {
		const names = new Set(bases.map((b) => this.scope.qualifiedName(b)));

		if (names.has('enum.StrEnum')) return 'str-enum';

		if (names.has('enum.Flag') || names.has('enum.IntFlag')) return 'flag';

		// `class E(str, Enum)` converts the generated int with `str()`.
		return names.has('builtins.str') ? 'string-mixin' : 'sequence';
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

/**
 * Computes the value `auto()` generates, as Python 3.12 and 3.13 do.
 *
 * @param kind - The enum's flavour.
 * @param name - The member name (used by `StrEnum`).
 * @param highest - The highest numeric value so far, or 0.
 * @returns A lower-cased name for `StrEnum`; for a `Flag` the next power of two; otherwise the
 *   highest value so far plus one.
 */
function nextAuto(
	kind: AutoKind,
	name: string,
	highest: number,
): number | string {
	if (kind === 'str-enum') return name.toLowerCase();

	if (kind === 'flag')
		return highest <= 0 ? 1 : 2 ** Math.floor(Math.log2(highest) + 1);

	return highest + 1;
}
