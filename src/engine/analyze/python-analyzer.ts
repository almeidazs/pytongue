/**
 * Python source to {@link ModuleInfo}: the analysis shared by the content mapper (types) and the
 * runtime loader (JS module), so what TypeScript sees and what runs can never disagree.
 *
 * @module
 */
import { parsePython } from '@/engine/parser';
import { definitionOf } from '@/shared';
import type {
	AnalyzeHost,
	ClassInfo,
	FunctionInfo,
	ModuleInfo,
} from '@/types/engine';

import { AnnotationTranslator } from './annotation-translator';
import { ClassAnalyzer } from './class-analyzer';
import { EnumAnalyzer } from './enum-analyzer';
import { ExportCollector } from './export-collector';
import { FieldAnalyzer } from './field-analyzer';
import { FunctionAnalyzer } from './function-analyzer';
import { ModuleBinder } from './module-binder';
import { ModuleScope } from './module-scope';
import { scriptMetadata } from './pep723';
import { collectSyntaxErrors } from './syntax-errors';

/** Analyzes one Python file. Wires the per-concern analyzers around a shared {@link ModuleScope}. */
export class PythonAnalyzer {
	private readonly scope: ModuleScope;
	private readonly binder: ModuleBinder;
	private readonly functions: FunctionAnalyzer;
	private readonly classes: ClassAnalyzer;
	private readonly exports: ExportCollector;

	/**
	 * Creates an analyzer for one file.
	 *
	 * @param source - The Python source text.
	 * @param fileName - The file's absolute path, for resolving relative imports.
	 * @param host - File access.
	 */
	constructor(
		private readonly source: string,
		fileName: string,
		host: AnalyzeHost,
	) {
		this.scope = new ModuleScope(fileName, host);
		this.binder = new ModuleBinder(this.scope);

		const annotations = new AnnotationTranslator(this.scope);

		this.functions = new FunctionAnalyzer(annotations);
		this.classes = new ClassAnalyzer(
			this.scope,
			new FieldAnalyzer(this.scope, annotations),
			new EnumAnalyzer(this.scope),
		);
		this.exports = new ExportCollector(this.scope, annotations);
	}

	/**
	 * Runs the analysis. The parser must be loaded (`loadParser()`).
	 *
	 * @returns Everything the emitters need about the file.
	 */
	analyze(): ModuleInfo {
		const tree = parsePython(this.source);

		try {
			const statements = tree.rootNode.namedChildren;
			const syntaxErrors = collectSyntaxErrors(tree.rootNode);

			for (const statement of statements)
				this.binder.bind(statement, true);

			// Decide every class kind up front, in source order, before annotations ask for them.
			for (const statement of statements) {
				const definition = definitionOf(statement);
				const name = definition.childForFieldName('name')?.text;

				if (definition.type === 'class_definition' && name)
					this.scope.classKind(name);
			}

			const functions: FunctionInfo[] = [];
			const classes: ClassInfo[] = [];

			for (const statement of statements) {
				const definition = definitionOf(statement);

				if (definition.type === 'function_definition')
					functions.push(this.functions.analyze(definition));
				else if (definition.type === 'class_definition') {
					const info = this.classes.analyze(definition);

					if (info) classes.push(info);
				}
			}

			const exports = this.exports.exports(functions, classes);
			const surface = this.exports.surface();
			const metadata = scriptMetadata(this.source);

			return {
				functions,
				classes,
				imports: this.scope.imports,
				exports,
				surface,
				moduleNotes: this.exports.notes,
				syntaxErrors,
				...(metadata === undefined ? {} : { scriptMetadata: metadata }),
			};
		} finally {
			tree.delete();
		}
	}
}

/**
 * Analyzes a Python file. The parser must be loaded (`loadParser()`).
 *
 * @param source - The Python source text.
 * @param fileName - The file's absolute path, for resolving relative imports.
 * @param host - File access.
 * @returns Everything the emitters need about the file.
 */
export function analyzePython(
	source: string,
	fileName: string,
	host: AnalyzeHost,
): ModuleInfo {
	return new PythonAnalyzer(source, fileName, host).analyze();
}
