/**
 * Building and walking {@link TypeRef} values.
 *
 * @module
 */
import type {
	DiagnosticCode,
	KeywordName,
	KeywordType,
	Span,
	TypeRef,
	UnknownType,
} from '@/types/engine';

/**
 * Creates an untranslatable type.
 *
 * @param reason - Why it cannot be translated, shown in hover.
 * @param code - The strict-mode diagnostic code.
 * @param span - The Python span the reason refers to.
 * @returns The `unknown` type.
 */
export function unknownType(
	reason: string,
	code: DiagnosticCode,
	span: Span,
): UnknownType {
	return { kind: 'unknown', reason, code, span };
}

/**
 * Creates a keyword type.
 *
 * @param ts - The TypeScript keyword.
 * @returns The keyword type.
 */
export function keywordType(ts: KeywordName): KeywordType {
	return { kind: 'keyword', ts };
}

/**
 * Builds a union, flattening nested unions and dropping duplicate keywords.
 *
 * @param members - The union members.
 * @returns The single member when only one is left, or the union.
 */
export function unionOf(members: TypeRef[]): TypeRef {
	const flat = members.flatMap((member) =>
		member.kind === 'union' ? member.members : [member],
	);
	const seen = new Set<string>();

	const out = flat.filter((member) => {
		if (member.kind !== 'keyword') return true;

		const key = member.ts + (member.int ? ':int' : '');

		if (seen.has(key)) return false;

		seen.add(key);

		return true;
	});

	return out.length === 1 ? out[0]! : { kind: 'union', members: out };
}

/**
 * Visits a type and every type nested in it, depth first.
 *
 * @param type - The root type.
 * @param visit - Called once per type.
 */
export function walkType(type: TypeRef, visit: (type: TypeRef) => void): void {
	visit(type);

	switch (type.kind) {
		case 'array':
			walkType(type.element, visit);
			break;
		case 'tuple':
			for (const element of type.elements) walkType(element, visit);

			break;
		case 'record':
			if (type.key) walkType(type.key, visit);

			walkType(type.value, visit);
			break;
		case 'union':
			for (const member of type.members) walkType(member, visit);

			break;
	}
}

/**
 * Tells whether a type needs parentheses before `[]`.
 *
 * @param type - The element type.
 * @returns `true` for unions and multi-value literals.
 */
export function needsParens(type: TypeRef): boolean {
	return (
		type.kind === 'union' ||
		(type.kind === 'literal' && type.values.length > 1)
	);
}
