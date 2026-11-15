/**
 * Fills a {@link ModuleScope} from the top-level statements of a Python file.
 *
 * @module
 */
import { dirname, join } from 'node:path';

import type { Node } from 'web-tree-sitter';

import { definitionOf, dotted, spanOf } from '@/shared';
import { TYPEVAR_FACTORIES, type ImportedName } from '@/types/engine';

import type { ModuleScope } from './module-scope';

/** Records what each top-level statement binds. */
export class ModuleBinder {
	/**
	 * Creates a binder.
	 *
	 * @param scope - The scope to fill.
	 */
	constructor(private readonly scope: ModuleScope) {}

	/**
	 * Records the names a statement binds.
	 *
	 * @param statement - A top-level statement, or an import nested in `if` / `try`.
	 * @param topLevel - Whether assignments in it count as module-level names.
	 */
	bind(statement: Node, topLevel: boolean): void {
		switch (statement.type) {
			case 'import_statement':
				this.bindImport(statement);

				return;
			case 'import_from_statement':
				this.bindFrom(statement);

				return;
			case 'future_import_statement':
				return;

			case 'type_alias_statement': {
				const left = statement.childForFieldName('left');
				const right = statement.childForFieldName('right');
				const name = left && dotted(left);

				if (name?.length === 1 && right)
					this.scope.bindings.set(name[0]!, {
						kind: 'alias',
						value: right,
					});

				return;
			}

			case 'if_statement':
			case 'try_statement':
				// `if TYPE_CHECKING:` and `try: import ... except ImportError:` blocks still bind names.
				for (const block of statement.descendantsOfType('block')) {
					for (const inner of block.namedChildren) {
						if (
							inner.type === 'import_statement' ||
							inner.type === 'import_from_statement'
						)
							this.bind(inner, false);
					}
				}

				return;
			case 'expression_statement':
				if (topLevel) this.bindAssignment(statement);

				return;
		}

		const definition = definitionOf(statement);
		const name = definition.childForFieldName('name')?.text;

		if (!name) return;

		if (definition.type === 'class_definition')
			this.scope.bindings.set(name, { kind: 'class', node: definition });
		else if (definition.type === 'function_definition')
			this.scope.bindings.set(name, {
				kind: 'function',
				node: definition,
			});
	}

	/**
	 * Binds `import x`, `import x.y` and `import x as y`.
	 *
	 * @param statement - An `import_statement` node.
	 */
	private bindImport(statement: Node): void {
		for (const name of statement.childrenForFieldName('name')) {
			if (name.type === 'aliased_import') {
				const module = dotted(name.childForFieldName('name')!)!.join(
					'.',
				);

				this.scope.bindings.set(name.childForFieldName('alias')!.text, {
					kind: 'module',
					module,
				});
			} else {
				const head = dotted(name)![0]!;

				this.scope.bindings.set(head, { kind: 'module', module: head });
			}
		}
	}

	/**
	 * Lists the names of a `from ... import ...` statement.
	 *
	 * @param statement - An `import_from_statement` node.
	 * @returns One entry per imported name.
	 */
	private importedNames(statement: Node): ImportedName[] {
		return statement.childrenForFieldName('name').map((n) =>
			n.type === 'aliased_import'
				? {
						imported: dotted(n.childForFieldName('name')!)!.join(
							'.',
						),
						local: n.childForFieldName('alias')!.text,
						node: n.childForFieldName('alias')!,
						importedNode: n.childForFieldName('name')!,
					}
				: {
						imported: dotted(n)!.join('.'),
						local: dotted(n)!.at(-1)!,
						node: n,
						importedNode: n,
					},
		);
	}

	/**
	 * Binds `from package import x` and the relative forms `from .x import Y` / `from . import x`.
	 *
	 * @param statement - An `import_from_statement` node.
	 */
	private bindFrom(statement: Node): void {
		const moduleNode = statement.childForFieldName('module_name')!;
		const entries = this.importedNames(statement);

		if (moduleNode.type !== 'relative_import') {
			const module = dotted(moduleNode)!.join('.');

			for (const entry of entries)
				this.scope.bindings.set(entry.local, {
					kind: 'from',
					module,
					name: entry.imported,
				});

			return;
		}

		const level = moduleNode.namedChildren.find(
			(c) => c.type === 'import_prefix',
		)!.text.length;
		const modulePath = moduleNode.namedChildren.find(
			(c) => c.type === 'dotted_name',
		);
		let base = this.scope.dir;

		for (let i = 1; i < level; i++) base = dirname(base);

		if (modulePath)
			this.bindFromModule(join(base, ...dotted(modulePath)!), entries);
		else this.bindFromPackage(base, entries);
	}

	/**
	 * Binds `from .x import Y`: every name comes from one module file.
	 *
	 * @param target - The module's absolute path without extension.
	 * @param entries - The imported names.
	 */
	private bindFromModule(target: string, entries: ImportedName[]): void {
		const file = this.scope.moduleFile(target);
		// `from .pkg import sub` may name a submodule of a package, or of a directory with no
		// `__init__.py` (a namespace package).
		const isPackage = !file || file.endsWith('__init__.py');

		for (const entry of entries) {
			if (isPackage && this.bindSubmodule(target, file, entry)) continue;

			if (!file) {
				this.scope.bindings.set(entry.local, {
					kind: 'relative-missing',
					target: this.scope.specifier(target + '.py'),
				});
				continue;
			}

			this.bindRelativeName(this.scope.specifier(file), entry);
		}
	}

	/**
	 * Binds a name imported from a package as a submodule, when it is one. A name the package's
	 * own `__init__.py` defines wins, since Python looks at the package's attributes first.
	 *
	 * @param target - The package's absolute path without extension.
	 * @param init - The package's `__init__.py`, if it has one.
	 * @param entry - The imported name.
	 * @returns `true` when the name was bound as a submodule.
	 */
	private bindSubmodule(
		target: string,
		init: string | undefined,
		entry: ImportedName,
	): boolean {
		const submodule = this.scope.moduleFile(join(target, entry.imported));

		if (!submodule) return false;

		const defined = init
			? this.scope.foreignModule(this.scope.specifier(init))
			: undefined;

		if (defined?.surface.some((e) => e.name === entry.imported))
			return false;

		const specifier = this.scope.specifier(submodule);
		const span = spanOf(entry.node);

		this.scope.bindings.set(entry.local, {
			kind: 'relative-module',
			specifier,
			span,
		});
		this.scope.imports.push({
			kind: 'namespace',
			specifier,
			local: entry.local,
			span,
		});

		return true;
	}

	/**
	 * Binds `from . import x`: `x` is a submodule when `x.py` or `x/__init__.py` exists, else a
	 * name defined in the package's `__init__.py`.
	 *
	 * @param base - The package directory.
	 * @param entries - The imported names.
	 */
	private bindFromPackage(base: string, entries: ImportedName[]): void {
		for (const entry of entries) {
			const span = spanOf(entry.node);
			const submodule = this.scope.moduleFile(join(base, entry.imported));

			if (submodule) {
				const specifier = this.scope.specifier(submodule);

				this.scope.bindings.set(entry.local, {
					kind: 'relative-module',
					specifier,
					span,
				});
				this.scope.imports.push({
					kind: 'namespace',
					specifier,
					local: entry.local,
					span,
				});
				continue;
			}

			const init = join(base, '__init__.py');

			if (!this.scope.host.fileExists(init)) {
				this.scope.bindings.set(entry.local, {
					kind: 'relative-missing',
					target: this.scope.specifier(
						join(base, entry.imported + '.py'),
					),
				});
				continue;
			}

			this.bindRelativeName(this.scope.specifier(init), entry);
		}
	}

	/**
	 * Binds one name imported from a resolved relative module.
	 *
	 * @param specifier - The module's specifier.
	 * @param entry - The imported name.
	 */
	private bindRelativeName(specifier: string, entry: ImportedName): void {
		const span = spanOf(entry.node);
		const foreign = this.scope.foreignModule(specifier);

		// A name the other file defines but does not export to other `.py` files (a variable, a
		// private function) has nothing to import in TypeScript: it stays a plain, non-type name.
		// A name it does not define at all is still imported, so TypeScript reports the missing
		// member on the Python import, the way Python raises `ImportError`.
		if (
			foreign?.definedNames.includes(entry.imported) &&
			!foreign.surface.some((e) => e.name === entry.imported)
		) {
			this.scope.bindings.set(entry.local, { kind: 'other' });

			return;
		}

		this.scope.bindings.set(entry.local, {
			kind: 'relative',
			specifier,
			imported: entry.imported,
			span,
		});
		this.scope.imports.push({
			kind: 'named',
			specifier,
			imported: entry.imported,
			local: entry.local,
			span,
			importedSpan: spanOf(entry.importedNode),
		});
	}

	/**
	 * Binds a top-level assignment: `__all__`, type aliases, type variables and plain variables.
	 *
	 * @param statement - An `expression_statement` node.
	 */
	private bindAssignment(statement: Node): void {
		const node = statement.namedChildren[0];

		if (!node) return;

		if (node.type === 'augmented_assignment') {
			if (node.childForFieldName('left')?.text === '__all__')
				this.scope.allDynamic = true;

			return;
		}

		if (node.type !== 'assignment') return;

		const left = node.childForFieldName('left');
		const right = node.childForFieldName('right');
		const annotation = node.childForFieldName('type');

		if (left?.type !== 'identifier') return;

		const name = left.text;
		const { bindings } = this.scope;

		if (name === '__all__') {
			if (this.scope.allNode) this.scope.allDynamic = true;

			this.scope.allNode = right ?? undefined;

			return;
		}

		if (!right) {
			bindings.set(name, { kind: 'other' });

			return;
		}

		if (annotation) {
			const isAlias =
				this.scope.qualifiedName(annotation) === 'typing.TypeAlias';

			bindings.set(
				name,
				isAlias ? { kind: 'alias', value: right } : { kind: 'other' },
			);

			return;
		}

		if (right.type === 'call') {
			const callee = this.scope.qualifiedName(
				right.childForFieldName('function'),
			);

			if (TYPEVAR_FACTORIES.has(callee)) {
				bindings.set(name, { kind: 'typevar' });

				return;
			}

			if (callee === 'typing.NewType') {
				const supertype =
					right.childForFieldName('arguments')?.namedChildren[1];

				if (supertype)
					bindings.set(name, { kind: 'alias', value: supertype });

				return;
			}
		}

		const isUnion =
			right.type === 'binary_operator' &&
			right.childForFieldName('operator')?.text === '|';

		// `MyInt = int`, `Row = Model`, `When = datetime.date`: a name that is a type is an alias.
		// A name that is a variable or function stays a plain variable.
		if (right.type === 'identifier' || right.type === 'attribute') {
			const target = this.scope.resolve(right);
			const isType =
				target.kind === 'qualified' ||
				target.kind === 'local-class' ||
				target.kind === 'relative' ||
				target.kind === 'alias';

			bindings.set(
				name,
				isType ? { kind: 'alias', value: right } : { kind: 'other' },
			);

			return;
		}

		bindings.set(
			name,
			right.type === 'subscript' || isUnion
				? { kind: 'alias', value: right }
				: { kind: 'other' },
		);
	}
}
