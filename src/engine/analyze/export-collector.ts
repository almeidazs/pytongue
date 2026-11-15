/**
 * The public exports of a Python module and its `$py$` type surface.
 *
 * @module
 */
import { join } from 'node:path';

import { parsePython } from '@/engine/parser';
import { definitionOf, stringValue } from '@/shared';
import type {
	ClassInfo,
	ExportEntry,
	FunctionInfo,
	SurfaceEntry,
} from '@/types/engine';

import type { AnnotationTranslator } from './annotation-translator';
import type { ModuleScope } from './module-scope';

/** Decides what a module exports, following `__all__` when it can be read statically. */
export class ExportCollector {
	/** Notes for the whole module, such as a dynamic `__all__`. */
	readonly notes: string[] = [];

	/**
	 * Creates an export collector.
	 *
	 * @param scope - The module's bindings and `__all__`.
	 * @param annotations - Translates type aliases for the surface.
	 */
	constructor(
		private readonly scope: ModuleScope,
		private readonly annotations: AnnotationTranslator,
	) {}

	/**
	 * Computes the public exports.
	 *
	 * @param functions - The module's functions.
	 * @param classes - The module's supported classes.
	 * @returns The names in `__all__`, or every public function and class when there is no literal `__all__`.
	 */
	exports(functions: FunctionInfo[], classes: ClassInfo[]): ExportEntry[] {
		const names = this.allNames();

		if (!names)
			return [
				...functions
					.filter((f) => !f.name.startsWith('_'))
					.map((f): ExportEntry => ({
						kind: 'function',
						name: f.name,
					})),
				...classes
					.filter((c) => !c.name.startsWith('_'))
					.map((c): ExportEntry => ({ kind: 'class', name: c.name })),
			];

		const out: ExportEntry[] = [];

		for (const name of names) {
			const entry = this.exportOf(name);

			if (entry) out.push(entry);
		}

		return out;
	}

	/**
	 * Computes the `$py$` surface: every class, type alias and relative import of the module,
	 * plus the functions it exports (type-only, so another file can import them by name).
	 *
	 * @param exports - The module's public exports.
	 * @returns The surface entries, in binding order.
	 */
	surface(exports: ExportEntry[]): SurfaceEntry[] {
		const out: SurfaceEntry[] = [];
		const exported = new Set(
			exports.filter((e) => e.kind === 'function').map((e) => e.name),
		);

		for (const [name, binding] of this.scope.bindings) {
			if (binding.kind === 'function') {
				if (exported.has(name)) out.push({ kind: 'function', name });
			} else if (binding.kind === 'class')
				out.push(
					this.scope.classKind(name) === 'other'
						? { kind: 'unknown', name }
						: { kind: 'class', name },
				);
			else if (binding.kind === 'alias')
				out.push({
					kind: 'alias',
					name,
					type: this.annotations.translate(binding.value),
				});
			else if (binding.kind === 'relative')
				out.push({
					kind: 'relative',
					name,
					specifier: binding.specifier,
					imported: binding.imported,
				});
			else if (binding.kind === 'relative-module')
				out.push({
					kind: 'relative-module',
					name,
					specifier: binding.specifier,
				});
		}

		return out;
	}

	/**
	 * Builds the export entry for one name of `__all__`.
	 *
	 * @param name - A name listed in `__all__`.
	 * @returns The entry, or `undefined` (with a module note) when the name cannot be exported.
	 */
	private exportOf(name: string): ExportEntry | undefined {
		const binding = this.scope.bindings.get(name);
		const notExported = `\`${name}\` in \`__all__\` is not a function, BaseModel, TypedDict or Enum, so it is not exported`;

		switch (binding?.kind) {
			case undefined:
				this.notes.push(
					`\`${name}\` is listed in \`__all__\` but not defined`,
				);

				return undefined;
			case 'function':
				return { kind: 'function', name };
			case 'class':
				if (this.scope.classKind(name) !== 'other')
					return { kind: 'class', name };

				this.notes.push(
					`\`${name}\` is not a function, BaseModel, TypedDict or Enum, so it is not exported`,
				);

				return undefined;
			case 'relative':
				return {
					kind: 'reexport',
					name,
					specifier: binding.specifier,
					imported: binding.imported,
					isType: this.peekIsType(
						binding.specifier,
						binding.imported,
					),
					span: binding.span,
				};
			case 'relative-module':
				return {
					kind: 'reexport',
					name,
					specifier: binding.specifier,
					imported: '*',
					isType: false,
					span: binding.span,
				};
			case 'from':
			case 'module':
				return {
					kind: 'package',
					name,
					module: binding.module,
					span: { start: 0, end: 0 },
				};
			default:
				this.notes.push(notExported);

				return undefined;
		}
	}

	/**
	 * Reads `__all__` when it is a literal list or tuple of strings.
	 *
	 * @returns The names, or `undefined` when there is no `__all__` or it is dynamic (with a note).
	 */
	private allNames(): string[] | undefined {
		const { allNode, allDynamic } = this.scope;

		if (!allNode && !allDynamic) return undefined;

		if (
			!allDynamic &&
			allNode &&
			(allNode.type === 'list' || allNode.type === 'tuple')
		) {
			const names = allNode.namedChildren.map((item) =>
				stringValue(item),
			);

			if (names.every((n) => n !== undefined)) return names as string[];
		}

		this.notes.push(
			'`__all__` is not a literal list of strings, so exports follow the public-name rule',
		);

		return undefined;
	}

	/**
	 * Takes a light look at another file to tell whether a name is a class there.
	 *
	 * @param specifier - The other file's specifier.
	 * @param name - The name to look up.
	 * @returns `true` for a class, `false` for a function, `undefined` when unknown.
	 */
	private peekIsType(specifier: string, name: string): boolean | undefined {
		const source = this.scope.host.readFile(
			join(this.scope.dir, specifier),
		);

		if (source === undefined) return undefined;

		const tree = parsePython(source);

		try {
			for (const statement of tree.rootNode.namedChildren) {
				const definition = definitionOf(statement);

				if (definition.childForFieldName('name')?.text !== name)
					continue;

				if (definition.type === 'class_definition') return true;

				if (definition.type === 'function_definition') return false;
			}

			return undefined;
		} finally {
			tree.delete();
		}
	}
}
