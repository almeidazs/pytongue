/**
 * The module-level name table of a Python file and the resolution of dotted references against it.
 *
 * @module
 */
import { dirname, join, relative, sep } from 'node:path';

import type { Node } from 'web-tree-sitter';

import { canonicalName, dotted, moduleOf, tsLocal } from '@/shared';
import {
	BUILTINS,
	ENUM_BASES,
	SURFACE_PREFIX,
	type AnalyzeHost,
	type ModuleInfo,
	type Binding,
	type ClassKind,
	type ForeignModuleLookup,
	type RelativeImport,
	type Resolved,
} from '@/types/engine';

/** What every top-level name of a Python file is bound to, and how references resolve. */
export class ModuleScope {
	/** Top-level bindings, in source order. */
	readonly bindings = new Map<string, Binding>();
	/** Relative imports, for `import type` in the virtual module. */
	readonly imports: RelativeImport[] = [];
	/** The directory of the Python file. */
	readonly dir: string;
	/** The value assigned to `__all__`, if any. */
	allNode: Node | undefined;
	/** Set when `__all__` is reassigned or augmented, so it cannot be read statically. */
	allDynamic = false;

	/**
	 * Creates an empty scope.
	 *
	 * @param fileName - The absolute path of the Python file.
	 * @param host - File access, for resolving relative imports.
	 * @param peek - Looks at the files this one imports from.
	 */
	constructor(
		fileName: string,
		readonly host: AnalyzeHost,
		private readonly peek: ForeignModuleLookup = () => undefined,
	) {
		this.dir = dirname(fileName);
	}

	/**
	 * Resolves a reference used in an annotation.
	 *
	 * @param node - An identifier, attribute or similar node.
	 * @returns What the reference names.
	 */
	resolve(node: Node): Resolved {
		const parts = dotted(node);

		if (!parts) return { kind: 'unresolved', name: node.text };

		return this.resolveParts(parts);
	}

	/**
	 * Resolves a reference to its canonical qualified name, when it is one.
	 *
	 * @param node - An identifier, attribute or similar node.
	 * @returns The canonical name (`typing.Optional`), or `''` when it is not a qualified name.
	 */
	qualifiedName(node: Node | null | undefined): string {
		if (!node) return '';

		const resolved = this.resolve(node);

		return resolved.kind === 'qualified'
			? canonicalName(resolved.name)
			: '';
	}

	/**
	 * Resolves a dotted reference given as parts.
	 *
	 * @param parts - The dotted parts, such as `['typing', 'Optional']`.
	 * @returns What the reference names.
	 */
	resolveParts(parts: string[]): Resolved {
		const head = parts[0]!;
		const rest = parts.slice(1);
		const binding = this.bindings.get(head);
		const written = parts.join('.');

		if (!binding) {
			if (parts.length === 1 && BUILTINS.has(head))
				return {
					kind: 'qualified',
					name: 'builtins.' + head,
					module: 'builtins',
				};

			return { kind: 'unresolved', name: written };
		}

		switch (binding.kind) {
			case 'module': {
				const name = [binding.module, ...rest].join('.');

				return { kind: 'qualified', name, module: moduleOf(name) };
			}

			case 'from': {
				const name = [binding.module, binding.name, ...rest].join('.');

				return { kind: 'qualified', name, module: moduleOf(name) };
			}

			case 'relative-module':
				// Through the other module's `$py$` surface.
				return rest.length === 1
					? {
							kind: 'relative',
							path: [tsLocal(head), SURFACE_PREFIX + rest[0]!],
							specifier: binding.specifier,
							imported: rest[0]!,
						}
					: { kind: 'unresolved', name: written };
			case 'relative':
				return rest.length === 0
					? {
							kind: 'relative',
							path: [tsLocal(head)],
							specifier: binding.specifier,
							imported: binding.imported,
						}
					: { kind: 'unresolved', name: written };
			case 'relative-missing':
				return { kind: 'missing', target: binding.target };
			case 'class':
				return rest.length === 0
					? {
							kind: 'local-class',
							name: head,
							classKind: this.classKind(head),
						}
					: { kind: 'not-a-type', name: written };
			case 'alias':
				return rest.length === 0
					? { kind: 'alias', name: head, value: binding.value }
					: { kind: 'not-a-type', name: written };
			case 'typevar':
				return { kind: 'typevar' };
			default:
				return { kind: 'not-a-type', name: written };
		}
	}

	/**
	 * Decides how pytongue treats a class of this file, from its bases. Memoized.
	 *
	 * @param name - The class name.
	 * @returns `model`, `typeddict`, `enum`, or `other` for unsupported classes and non-classes.
	 */
	classKind(name: string): ClassKind {
		const binding = this.bindings.get(name);

		if (!binding || binding.kind !== 'class') return 'other';

		if (binding.classKind) return binding.classKind;

		binding.classKind = 'other'; // guards against cycles while resolving bases

		let kind: ClassKind = 'other';
		const bases =
			binding.node.childForFieldName('superclasses')?.namedChildren ?? [];

		for (const base of bases) {
			if (base.type === 'keyword_argument') continue;

			const resolved = this.resolve(
				base.type === 'subscript'
					? base.childForFieldName('value')!
					: base,
			);

			if (resolved.kind === 'qualified') {
				const qualified = canonicalName(resolved.name);

				if (qualified === 'pydantic.BaseModel') kind = 'model';
				else if (qualified === 'typing.TypedDict') kind = 'typeddict';
				else if (ENUM_BASES.has(qualified)) kind = 'enum';
			} else if (
				resolved.kind === 'local-class' &&
				resolved.classKind !== 'other'
			)
				kind = resolved.classKind;
			else if (resolved.kind === 'relative') {
				// A base from another file: ask that file what it is. When it cannot say (an
				// import cycle, a re-export), model semantics are the safe guess.
				const foreign = this.foreignClassKind(
					resolved.specifier,
					resolved.imported,
				);

				if (foreign) kind = foreign;
				else if (kind === 'other') kind = 'model';
			}

			if (kind !== 'other' && kind !== 'model') break;
		}

		binding.classKind = kind;

		return kind;
	}

	/**
	 * Analyzes the file a relative specifier points at.
	 *
	 * @param specifier - A specifier such as `./models.py`.
	 * @returns The file's analysis, or `undefined` when it cannot be read or is in an import cycle.
	 */
	foreignModule(specifier: string): ModuleInfo | undefined {
		return this.peek(join(this.dir, specifier));
	}

	/**
	 * Tells how pytongue treats a class defined in another file.
	 *
	 * @param specifier - The other file's specifier.
	 * @param name - The class name there.
	 * @returns `model`, `typeddict` or `enum`, or `undefined` when the file does not define it.
	 */
	private foreignClassKind(
		specifier: string,
		name: string,
	): ClassKind | undefined {
		return this.foreignModule(specifier)?.classes.find(
			(c) => c.name === name,
		)?.kind;
	}

	/**
	 * Finds the file of a Python module path. A package wins over a module of the same name,
	 * as it does in Python.
	 *
	 * @param target - An absolute path without extension.
	 * @returns `target.py` or `target/__init__.py`, whichever exists, or `undefined`.
	 */
	moduleFile(target: string): string | undefined {
		for (const candidate of [join(target, '__init__.py'), target + '.py']) {
			if (this.host.fileExists(candidate)) return candidate;
		}

		return undefined;
	}

	/**
	 * Spells a file as a relative TypeScript module specifier.
	 *
	 * @param file - An absolute path.
	 * @returns A specifier starting with `./` or `../`.
	 */
	specifier(file: string): string {
		const rel = relative(this.dir, file).split(sep).join('/');

		return rel.startsWith('.') ? rel : './' + rel;
	}
}
