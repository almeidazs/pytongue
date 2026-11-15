/**
 * Translation of Python annotations into {@link TypeRef} values.
 *
 * @module
 */
import type { Node } from 'web-tree-sitter';

import { parsePython } from '@/engine/parser';
import {
	canonicalName,
	innerType,
	keywordType,
	literalValue,
	spanOf,
	stringValue,
	subscriptParts,
	tsLocal,
	unionOf,
	unknownType,
} from '@/shared';
import {
	ARRAY_LIKE,
	ASYNC_GENERATORS,
	BOOL_LIKE,
	BYTES_LIKE,
	DiagnosticCode,
	FLOAT_LIKE,
	FORWARD_REF_PREFIX,
	INT_LIKE,
	KNOWN_MODULES,
	MAPPING_LIKE,
	MAX_ALIAS_DEPTH,
	STRING_LIKE,
	SYNC_GENERATORS,
	UNWRAP,
	type LiteralValue,
	type QualifiedName,
	type Resolved,
	type Span,
	type TypeRef,
} from '@/types/engine';

import type { ModuleScope } from './module-scope';

/** Translates annotations, resolving names against the module scope. */
export class AnnotationTranslator {
	/** Type-parameter names in scope (PEP 695 `def f[T]`), which are generics. */
	private readonly typeVars = new Set<string>();
	/** Names of the aliases being expanded right now, to cut recursive aliases. */
	private readonly expanding = new Set<string>();

	/**
	 * Creates a translator.
	 *
	 * @param scope - The scope names are resolved in.
	 */
	constructor(private readonly scope: ModuleScope) {}

	/**
	 * Runs a callback with PEP 695 type parameters in scope, so uses of them are recognized as
	 * generics instead of unresolved names.
	 *
	 * @param names - The declared type-parameter names.
	 * @param callback - What to run.
	 * @returns The callback's result.
	 */
	withTypeVars<T>(names: string[], callback: () => T): T {
		const added = names.filter((name) => !this.typeVars.has(name));

		for (const name of added) this.typeVars.add(name);

		try {
			return callback();
		} finally {
			for (const name of added) this.typeVars.delete(name);
		}
	}

	/**
	 * Translates an annotation.
	 *
	 * @param node - The annotation node.
	 * @param offset - Span offset, for nodes re-parsed out of a string annotation.
	 * @param depth - Alias expansion depth, to stop cycles.
	 * @returns The translated type; `unknown` with a reason when it has no TypeScript equivalent.
	 */
	translate(node: Node, offset = 0, depth = 0): TypeRef {
		const span = spanOf(node, offset);

		if (depth > MAX_ALIAS_DEPTH)
			return unknownType(
				'type alias nests too deeply',
				DiagnosticCode.Untranslatable,
				span,
			);

		switch (node.type) {
			case 'type':
			case 'parenthesized_expression':
				if (node.namedChildCount === 1)
					return this.translate(
						node.namedChildren[0]!,
						offset,
						depth,
					);

				break;
			case 'none':
				return keywordType('null');
			case 'string':
			case 'concatenated_string':
				return this.forwardRef(node, offset, depth);
			case 'identifier':
			case 'attribute':
			case 'member_type':
				if (node.type === 'identifier' && this.typeVars.has(node.text))
					return unknownType(
						'type variables (generics) are not supported yet',
						DiagnosticCode.Untranslatable,
						span,
					);

				return this.nameType(this.scope.resolve(node), span, depth);
			case 'generic_type':

			case 'subscript': {
				const { base, args } = subscriptParts(node);

				return this.subscriptType(base!, args, span, offset, depth);
			}

			case 'union_type':
				return unionOf(
					node.namedChildren.map((c) =>
						this.translate(c, offset, depth),
					),
				);
			case 'binary_operator':
				if (node.childForFieldName('operator')?.text === '|')
					return unionOf([
						this.translate(
							node.childForFieldName('left')!,
							offset,
							depth,
						),
						this.translate(
							node.childForFieldName('right')!,
							offset,
							depth,
						),
					]);

				break;
		}

		return unknownType(
			`unsupported annotation \`${node.text}\``,
			DiagnosticCode.Untranslatable,
			span,
		);
	}

	/**
	 * Extracts the element type of a generator from its return annotation.
	 *
	 * @param returnNode - The return annotation, such as `Iterator[int]`.
	 * @returns The element type, or `unknown` for an unexpected annotation.
	 */
	generatorElement(returnNode: Node): TypeRef {
		const { base, args } = subscriptParts(returnNode);
		const qualified = this.scope.qualifiedName(base);

		if (
			(SYNC_GENERATORS.has(qualified) ||
				ASYNC_GENERATORS.has(qualified)) &&
			args[0]
		)
			return this.translate(args[0]);

		return unknownType(
			`generator annotated as \`${returnNode.text}\` (expected Iterator[T], Generator[T, ...] or AsyncIterator[T])`,
			DiagnosticCode.Untranslatable,
			spanOf(returnNode),
		);
	}

	/**
	 * Translates a string (forward reference) annotation by re-parsing it in annotation position.
	 *
	 * @param node - A `string` node.
	 * @param offset - The current span offset.
	 * @param depth - The current alias depth.
	 * @returns The translated type, with spans pointing inside the original string.
	 */
	private forwardRef(node: Node, offset: number, depth: number): TypeRef {
		const span = spanOf(node, offset);
		const value = stringValue(node);
		const content = node.namedChildren.find(
			(c) => c.type === 'string_content',
		);

		if (value === undefined || !content || content.namedChildCount > 0)
			return unknownType(
				`unsupported string annotation \`${node.text}\``,
				DiagnosticCode.Untranslatable,
				span,
			);

		const tree = parsePython(FORWARD_REF_PREFIX + value);

		try {
			const annotation =
				tree.rootNode.namedChildren[0]?.namedChildren[0]?.childForFieldName(
					'type',
				);

			if (!annotation || tree.rootNode.hasError)
				return unknownType(
					`cannot parse string annotation \`${node.text}\``,
					DiagnosticCode.Untranslatable,
					span,
				);

			return this.translate(
				annotation,
				content.startIndex + offset - FORWARD_REF_PREFIX.length,
				depth + 1,
			);
		} finally {
			tree.delete();
		}
	}

	/**
	 * Translates a bare name.
	 *
	 * @param resolved - What the name resolves to.
	 * @param span - Where the name appears.
	 * @param depth - The current alias depth.
	 * @returns The translated type.
	 */
	private nameType(resolved: Resolved, span: Span, depth: number): TypeRef {
		switch (resolved.kind) {
			case 'qualified':
				return this.qualifiedType(resolved, span);
			case 'local-class':
				if (resolved.classKind === 'other')
					return unknownType(
						`class \`${resolved.name}\` is not a BaseModel, TypedDict or Enum`,
						DiagnosticCode.Untranslatable,
						span,
					);

				return { kind: 'ref', path: [tsLocal(resolved.name)], span };
			case 'relative':
				return { kind: 'ref', path: resolved.path, span };

			case 'alias': {
				// `Json = dict[str, "Json"] | list["Json"]` would otherwise expand to the depth limit
				// on every branch: cut the recursion where it comes back to itself.
				if (this.expanding.has(resolved.name))
					return unknownType(
						`type alias \`${resolved.name}\` is recursive`,
						DiagnosticCode.Untranslatable,
						span,
					);

				this.expanding.add(resolved.name);

				try {
					return this.translate(resolved.value, 0, depth + 1);
				} finally {
					this.expanding.delete(resolved.name);
				}
			}

			case 'typevar':
				return unknownType(
					'type variables (generics) are not supported yet',
					DiagnosticCode.Untranslatable,
					span,
				);
			case 'missing':
				return unknownType(
					`cannot find module \`${resolved.target}\``,
					DiagnosticCode.UnresolvedName,
					span,
				);
			case 'unresolved':
				return unknownType(
					`cannot resolve \`${resolved.name}\``,
					DiagnosticCode.UnresolvedName,
					span,
				);
			case 'not-a-type':
				return unknownType(
					`\`${resolved.name}\` is not a type`,
					DiagnosticCode.Untranslatable,
					span,
				);
		}
	}

	/**
	 * Translates a bare qualified name such as `str`, `datetime.date` or `typing.Any`.
	 *
	 * @param resolved - The qualified name.
	 * @param span - Where it appears.
	 * @returns The translated type.
	 */
	private qualifiedType(resolved: QualifiedName, span: Span): TypeRef {
		const qualified = canonicalName(resolved.name);

		if (STRING_LIKE.has(qualified)) return keywordType('string');

		if (INT_LIKE.has(qualified))
			return { kind: 'keyword', ts: 'number', int: true };

		if (FLOAT_LIKE.has(qualified)) return keywordType('number');

		if (BOOL_LIKE.has(qualified)) return keywordType('boolean');

		if (qualified === 'typing.Any' || qualified === 'builtins.object')
			return keywordType('unknown');

		if (ARRAY_LIKE.has(qualified) || qualified === 'builtins.tuple')
			return { kind: 'array', element: keywordType('unknown') };

		if (MAPPING_LIKE.has(qualified))
			return { kind: 'record', key: null, value: keywordType('unknown') };

		if (BYTES_LIKE.has(qualified))
			return unknownType(
				`\`${qualified.split('.').at(-1)}\` has no JSON form`,
				DiagnosticCode.Untranslatable,
				span,
			);

		return this.foreignType(resolved, span);
	}

	/**
	 * Explains why a qualified name is not translated.
	 *
	 * @param resolved - The qualified name.
	 * @param span - Where it appears.
	 * @returns `unknown`, with a package or not-supported reason.
	 */
	private foreignType(resolved: QualifiedName, span: Span): TypeRef {
		if (KNOWN_MODULES.has(resolved.module))
			return unknownType(
				`\`${resolved.name}\` is not supported`,
				DiagnosticCode.Untranslatable,
				span,
			);

		return unknownType(
			`\`${resolved.name}\` comes from the module \`${resolved.module}\``,
			DiagnosticCode.PackageType,
			span,
		);
	}

	/**
	 * Translates a subscripted annotation such as `Optional[int]` or `dict[str, float]`.
	 *
	 * @param baseNode - The subscripted name.
	 * @param args - The arguments inside the brackets.
	 * @param span - The span of the whole annotation.
	 * @param offset - The current span offset.
	 * @param depth - The current alias depth.
	 * @returns The translated type.
	 */
	private subscriptType(
		baseNode: Node,
		args: Node[],
		span: Span,
		offset: number,
		depth: number,
	): TypeRef {
		const resolved = this.scope.resolve(baseNode);

		if (resolved.kind !== 'qualified') {
			if (
				resolved.kind === 'local-class' ||
				resolved.kind === 'relative' ||
				resolved.kind === 'alias'
			)
				return unknownType(
					`generic \`${baseNode.text}[...]\` is not supported yet`,
					DiagnosticCode.Untranslatable,
					span,
				);

			return this.nameType(resolved, span, depth);
		}

		const qualified = canonicalName(resolved.name);
		const arg = (n: Node | undefined) =>
			n ? this.translate(n, offset, depth) : keywordType('unknown');

		if (qualified === 'typing.Optional')
			return unionOf([arg(args[0]), keywordType('null')]);

		if (qualified === 'typing.Union')
			return unionOf(args.map((a) => arg(a)));

		if (qualified === 'typing.Literal')
			return this.literal(args, span, offset, depth);

		if (UNWRAP.has(qualified)) return arg(args[0]);

		if (ARRAY_LIKE.has(qualified) || qualified === 'typing.Generator')
			return { kind: 'array', element: arg(args[0]) };

		if (qualified === 'builtins.tuple') return this.tuple(args, arg);

		if (MAPPING_LIKE.has(qualified)) {
			const key = arg(args[0]);
			const value = arg(args[1]);

			if (key.kind === 'keyword' && key.ts === 'string')
				return { kind: 'record', key: null, value };

			if (
				key.kind === 'literal' &&
				key.values.every((v) => typeof v === 'string')
			)
				return { kind: 'record', key, value };

			return unknownType(
				'dict keys must be `str` to cross into JSON',
				DiagnosticCode.Untranslatable,
				span,
			);
		}

		if (ASYNC_GENERATORS.has(qualified))
			return unknownType(
				`\`${baseNode.text}\` can only be returned by a generator`,
				DiagnosticCode.Untranslatable,
				span,
			);

		if (qualified === 'typing.Callable' || qualified === 'builtins.type')
			return unknownType(
				`\`${baseNode.text}\` cannot cross the process boundary`,
				DiagnosticCode.Untranslatable,
				span,
			);

		return this.foreignType(resolved, span);
	}

	/**
	 * Translates `tuple[...]`: `tuple[T, ...]` is an array, `tuple[()]` is empty.
	 *
	 * @param args - The tuple arguments.
	 * @param arg - Translates one argument.
	 * @returns The array or tuple type.
	 */
	private tuple(
		args: Node[],
		arg: (n: Node | undefined) => TypeRef,
	): TypeRef {
		const last = args.at(-1);
		const variadic =
			args.length === 2 &&
			last !== undefined &&
			(last.text === '...' || last.namedChildren[0]?.type === 'ellipsis');

		if (variadic) return { kind: 'array', element: arg(args[0]) };

		if (args.length === 1 && args[0]!.text.replace(/\s/g, '') === '()')
			return { kind: 'tuple', elements: [] };

		return { kind: 'tuple', elements: args.map((a) => arg(a)) };
	}

	/**
	 * Translates `Literal[...]`, flattening nested literals and literal aliases.
	 *
	 * @param args - The literal arguments.
	 * @param span - The span of the whole annotation.
	 * @param offset - The current span offset.
	 * @param depth - The current alias depth.
	 * @returns The literal union, or `unknown` for a value that is not a literal.
	 */
	private literal(
		args: Node[],
		span: Span,
		offset: number,
		depth: number,
	): TypeRef {
		const values: LiteralValue[] = [];

		for (const raw of args) {
			const node = innerType(raw);
			const value = literalValue(node);

			if (value !== undefined) {
				values.push(value);
				continue;
			}

			const nested = this.translate(node, offset, depth + 1);

			if (nested.kind !== 'literal')
				return unknownType(
					`unsupported Literal value \`${node.text}\``,
					DiagnosticCode.Untranslatable,
					span,
				);

			values.push(...nested.values);
		}

		return { kind: 'literal', values };
	}
}
