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
import { collectIndentationErrors, collectSyntaxErrors } from './syntax-errors';

/** Analyses of imported files, valid for as long as their text is the same. */
const peeked = new Map<string, { source: string; info: ModuleInfo }>();

/** Files being analyzed right now: reaching one again means an import cycle. */
const inFlight = new Set<string>();

/** Counts the times a cycle cut an analysis short. */
let cycleCuts = 0;

/**
 * Runs an analysis of one file, marking it in flight so a cycle back to it is cut.
 *
 * @param file - The file's absolute path.
 * @param run - Performs the analysis.
 * @returns What `run` returns.
 */
function guarded<T>(file: string, run: () => T): T {
	const owned = !inFlight.has(file);

	inFlight.add(file);

	try {
		return run();
	} finally {
		if (owned) inFlight.delete(file);
	}
}

/**
 * Analyzes a file another file imports from.
 *
 * @param file - The file's absolute path.
 * @param host - File access.
 * @returns Its analysis, or `undefined` when it cannot be read or is part of an import cycle.
 *   An analysis that a cycle cut short is not cached, so a later look at the file is complete.
 */
function peekModule(file: string, host: AnalyzeHost): ModuleInfo | undefined {
	const source = host.readFile(file);

	if (source === undefined) return undefined;

	if (inFlight.has(file)) {
		cycleCuts++;

		return undefined;
	}

	const cached = peeked.get(file);

	if (cached?.source === source) return cached.info;

	const before = cycleCuts;
	const info = guarded(file, () =>
		new PythonAnalyzer(source, file, host).analyze(),
	);

	if (cycleCuts === before) peeked.set(file, { source, info });

	return info;
}

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
		this.scope = new ModuleScope(fileName, host, (file) =>
			peekModule(file, host),
		);
		this.binder = new ModuleBinder(this.scope);

		const annotations = new AnnotationTranslator(this.scope);

		this.functions = new FunctionAnalyzer(annotations);
		this.classes = new ClassAnalyzer(
			this.scope,
			new FieldAnalyzer(this.scope, annotations),
			new EnumAnalyzer(this.scope),
			annotations,
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

			// After a real syntax error tree-sitter's recovery makes the structure unreliable, and
			// indentation checks would only echo it.
			if (!syntaxErrors.length)
				collectIndentationErrors(tree.rootNode, syntaxErrors);

			syntaxErrors.sort((a, b) => a.span.start - b.span.start);

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
			const surface = this.exports.surface(exports);
			const metadata = scriptMetadata(this.source);

			return {
				functions,
				classes,
				imports: this.scope.imports,
				exports,
				surface,
				definedNames: [...this.scope.bindings.keys()],
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
	return guarded(fileName, () =>
		new PythonAnalyzer(source, fileName, host).analyze(),
	);
}
