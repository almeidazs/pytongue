/**
 * {@link ModuleInfo} to the JavaScript module a `.py` import loads at runtime: one forwarding
 * function per exported Python function, all calling into one worker. Built from the same
 * analysis as the types.
 *
 * @module
 */
import { dirname, join } from 'node:path';

import { analyzePython } from '@/engine/analyze';
import type { AnalyzeHost, ExportEntry, ModuleInfo } from '@/types/engine';
import { GENERIC_LAYOUT, type Layout } from '@/types/runtime';

import { envSpec } from './environment';
import { layoutOf, reexportLayout } from './layout';

/** Generates the JavaScript module for one Python file. */
export class RuntimeModuleEmitter {
	private readonly lines: string[] = [];
	private readonly exported: string[] = [];

	/**
	 * Creates an emitter.
	 *
	 * @param source - The Python source.
	 * @param file - The file's absolute path.
	 * @param host - File access.
	 * @param runtimeUrl - The URL of pytongue's runtime module, which the generated code imports.
	 */
	constructor(
		private readonly source: string,
		private readonly file: string,
		private readonly host: AnalyzeHost,
		private readonly runtimeUrl: string,
	) {}

	/**
	 * Emits the module.
	 *
	 * @returns The JavaScript source.
	 * @throws {SyntaxError} When the Python file has a syntax error.
	 */
	emit(): string {
		const info = analyzePython(this.source, this.file, this.host);

		this.assertParses(info);

		const env = envSpec(info, this.file, this.host);

		this.lines.push(
			`import { pyModule } from ${JSON.stringify(this.runtimeUrl)};`,
			`const $m = pyModule(${JSON.stringify(this.file)}, ${JSON.stringify(env)});`,
		);

		for (const entry of info.exports) {
			const layout = this.layoutFor(entry, info);

			if (layout) this.addFunction(entry.name, layout);
		}

		if (this.exported.length)
			this.lines.push(`export { ${this.exported.join(', ')} };`);

		return this.lines.join('\n') + '\n';
	}

	/**
	 * Fails the import on a syntax error, as Python itself would.
	 *
	 * @param info - The analyzed file.
	 * @throws {SyntaxError} With the first error's message, file and line.
	 */
	private assertParses(info: ModuleInfo): void {
		const first = info.syntaxErrors[0];

		if (!first) return;

		const line = this.source.slice(0, first.span.start).split('\n').length;

		throw new SyntaxError(`${first.message} (${this.file}:${line})`);
	}

	/**
	 * Decides whether an export becomes a forwarding function, and with which layout.
	 *
	 * @param entry - A public export.
	 * @param info - The analyzed file.
	 * @returns The layout, or `undefined` for exports with no runtime value (classes).
	 */
	private layoutFor(
		entry: ExportEntry,
		info: ModuleInfo,
	): Layout | undefined {
		switch (entry.kind) {
			case 'function': {
				const fn = info.functions.find((f) => f.name === entry.name)!;

				return layoutOf(fn);
			}

			case 'reexport':
				// Runs in this file's worker (the name is an attribute of this module in Python
				// too); the layout comes from the definition in the other file.
				if (entry.isType === true || entry.imported === '*')
					return undefined;

				return reexportLayout(
					join(dirname(this.file), entry.specifier),
					entry.imported,
					this.host,
				);
			case 'package':
				return { ...GENERIC_LAYOUT };
			default:
				return undefined;
		}
	}

	/**
	 * Adds one forwarding function and its export.
	 *
	 * @param name - The Python function name (also the export name).
	 * @param layout - Its call layout.
	 */
	private addFunction(name: string, layout: Layout): void {
		const local = `$f_${this.exported.length}`;

		this.lines.push(
			`const ${local} = $m.fn(${JSON.stringify(name)}, ${JSON.stringify(layout)});`,
		);
		// An export name may be any IdentifierName, reserved words included (`as delete`).
		this.exported.push(`${local} as ${name}`);
	}
}

/**
 * Generates the JavaScript module for a Python file.
 *
 * @param source - The Python source.
 * @param file - The file's absolute path.
 * @param host - File access.
 * @param runtimeUrl - The URL of pytongue's runtime module.
 * @returns The JavaScript source.
 * @throws {SyntaxError} When the Python file has a syntax error.
 */
export function runtimeModule(
	source: string,
	file: string,
	host: AnalyzeHost,
	runtimeUrl: string,
): string {
	return new RuntimeModuleEmitter(source, file, host, runtimeUrl).emit();
}
