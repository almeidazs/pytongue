/**
 * {@link ModuleInfo} to the virtual `.mts` module TypeScript type-checks against, with every name
 * mapped back to its Python identifier (hover, go-to-definition, references; never rename).
 *
 * @module
 */
import {
	MappedCodeBuilder,
	SpanMapFeature,
	type TransformResult,
} from 'ts-content-mapper';

import {
	MODULE_HEADER,
	VIRTUAL_EXTENSION,
	type EmitOptions,
	type ModuleInfo,
} from '@/types/engine';

import { ClassEmitter } from './class-emitter';
import { DiagnosticsBuilder } from './diagnostics';
import { DocWriter } from './doc-writer';
import { ExportEmitter } from './export-emitter';
import { FunctionEmitter } from './function-emitter';
import { ImportEmitter } from './import-emitter';
import { SurfaceEmitter } from './surface-emitter';
import { TypeWriter } from './type-writer';

/** Builds the virtual TypeScript module of one Python file. */
export class TypeModuleEmitter {
	private readonly builder: MappedCodeBuilder;
	private readonly types: TypeWriter;
	private readonly docs: DocWriter;

	/**
	 * Creates an emitter.
	 *
	 * @param info - The analyzed Python file.
	 * @param source - The Python source, for mappings and positions.
	 * @param options - Strict mode and position encoding.
	 */
	constructor(
		private readonly info: ModuleInfo,
		private readonly source: string,
		private readonly options: EmitOptions,
	) {
		this.builder = new MappedCodeBuilder(source, {
			positionEncoding: options.positionEncoding,
		});
		this.types = new TypeWriter(this.builder);
		this.docs = new DocWriter(this.builder, info.moduleNotes);
	}

	/**
	 * Emits the module.
	 *
	 * @returns The virtual module, its mappings and diagnostics, as the content mapper returns them.
	 */
	emit(): TransformResult {
		const { builder, info } = this;

		// A zero-length anchor at the top: go-to-definition on the module specifier lands on line 1.
		builder.appendAnchored(MODULE_HEADER, 0, SpanMapFeature.Definition);
		new ImportEmitter(builder).emit(info.imports);

		const classes = new ClassEmitter(
			builder,
			this.types,
			this.docs,
			this.hoistInputs(),
		);

		for (const entry of info.classes) classes.emit(entry);

		const functions = new FunctionEmitter(builder, this.types, this.docs);

		for (const entry of info.exports)
			if (entry.kind === 'function')
				for (const fn of info.functions)
					if (fn.name === entry.name) functions.emit(fn);

		new ExportEmitter(builder, this.docs).emit(info.exports);
		new SurfaceEmitter(builder, this.types).emit(info.surface);

		const diagnostics = new DiagnosticsBuilder(
			this.source,
			this.options.positionEncoding,
		)
			.syntaxErrors(info.syntaxErrors)
			.unknowns(this.options.strict ? this.types.unknowns.values() : [])
			.build();

		return {
			...builder.build(VIRTUAL_EXTENSION),
			...(diagnostics.length ? { diagnostics } : {}),
		};
	}

	/**
	 * Tells whether input shapes must be hoisted: a Python name `Input` would be shadowed inside
	 * `namespace X { interface Input }`.
	 *
	 * @returns `true` when a class or an import is named `Input`.
	 */
	private hoistInputs(): boolean {
		return (
			this.info.classes.some((c) => c.name === 'Input') ||
			this.info.imports.some((i) => i.local === 'Input')
		);
	}
}

/**
 * Emits the virtual TypeScript module of an analyzed Python file.
 *
 * @param info - The analyzed file.
 * @param source - The Python source.
 * @param options - Strict mode and position encoding.
 * @returns The content mapper's transform result.
 */
export function emitTypes(
	info: ModuleInfo,
	source: string,
	options: EmitOptions,
): TransformResult {
	return new TypeModuleEmitter(info, source, options).emit();
}
