/**
 * Emits models, TypedDicts and enums as interfaces and type aliases with an `.Input` shape.
 *
 * @module
 */
import type { MappedCodeBuilder } from 'ts-content-mapper';

import { propertyName, tsLocal, walkType } from '@/shared';
import {
	MAPPED_FEATURES,
	type ClassInfo,
	type EnumInfo,
	type FieldInfo,
	type ModelInfo,
} from '@/types/engine';

import type { DocWriter } from './doc-writer';
import type { TypeWriter } from './type-writer';

/**
 * Writes classes. Every type gets a `.Input` member (a namespace merged with the type), so input
 * positions can always say `X.Input`, even for types imported from another file.
 */
export class ClassEmitter {
	/**
	 * Creates a class emitter.
	 *
	 * @param builder - The virtual module being built.
	 * @param types - Writes field types.
	 * @param docs - Writes docstrings and notes.
	 * @param hoistInputs - Write input shapes at top level (`$Input$X`), needed when a Python name
	 *   `Input` would be shadowed inside `namespace X { interface Input }`.
	 */
	constructor(
		private readonly builder: MappedCodeBuilder,
		private readonly types: TypeWriter,
		private readonly docs: DocWriter,
		private readonly hoistInputs: boolean,
	) {}

	/**
	 * Writes one class.
	 *
	 * @param info - The class.
	 */
	emit(info: ClassInfo): void {
		if (info.kind === 'enum') this.emitEnum(info);
		else this.emitModel(info);
	}

	/**
	 * Writes an enum as a type alias of its values, with `.Input` as the same type.
	 *
	 * @param info - The enum.
	 */
	private emitEnum(info: EnumInfo): void {
		const name = tsLocal(info.name);

		this.docs.write(info.doc, this.docs.remarksFor([info.type]));
		this.builder
			.append('type ')
			.appendAlias(name, info.span.start, info.span.end, MAPPED_FEATURES)
			.append(' = ');
		this.types.write(info.type, false);
		this.builder.append(';\n');
		this.emitInputAlias(name, name);
	}

	/**
	 * Writes a model or TypedDict: the output interface, then its input shape.
	 *
	 * @param info - The model or TypedDict.
	 */
	private emitModel(info: ModelInfo): void {
		const b = this.builder;
		const name = tsLocal(info.name);

		this.docs.write(
			info.doc,
			this.docs.remarksFor(info.fields.map((f) => f.type)),
		);
		b.append('interface ').appendAlias(
			name,
			info.span.start,
			info.span.end,
			MAPPED_FEATURES,
		);
		this.emitExtends(info, false);
		b.append(' {\n');

		for (const field of info.fields) this.emitField(field, false);

		b.append('}\n');

		if (!this.needsInputShape(info)) {
			this.emitInputAlias(name, name);

			return;
		}

		if (this.hoistInputs) {
			const inputName = `$Input$${name}`;

			b.append(`interface ${inputName}`);
			this.emitExtends(info, true);
			b.append(' {\n');

			for (const field of info.fields)
				if (!field.outputOnly) this.emitField(field, true);

			b.append('}\n');
			this.emitInputAlias(name, inputName);

			return;
		}

		b.append(`declare namespace ${name} {\n  interface Input`);
		this.emitExtends(info, true);
		b.append(' {\n');

		for (const field of info.fields)
			if (!field.outputOnly) this.emitField(field, true);

		b.append('  }\n}\n');
	}

	/**
	 * Writes `declare namespace X { type Input = Y; }`.
	 *
	 * @param name - The type's TypeScript name.
	 * @param target - What `X.Input` stands for.
	 */
	private emitInputAlias(name: string, target: string): void {
		this.builder.append(
			`declare namespace ${name} {\n  type Input = ${target};\n}\n`,
		);
	}

	/**
	 * Writes ` extends A, B` (or `A.Input, B.Input` for the input shape).
	 *
	 * @param info - The model.
	 * @param input - Whether the input shape is being written.
	 */
	private emitExtends(info: ModelInfo, input: boolean): void {
		if (!info.bases.length) return;

		this.builder.append(' extends ');
		this.types.writeList(info.bases, ', ', input);
	}

	/**
	 * Writes one property.
	 *
	 * @param field - The field.
	 * @param input - Whether the input shape is being written.
	 */
	private emitField(field: FieldInfo, input: boolean): void {
		const b = this.builder;
		const indent = input && !this.hoistInputs ? '    ' : '  ';

		if (field.doc) {
			const doc = field.doc
				.replace(/\*\//g, '*\\/')
				.replace(/\n/g, `\n${indent} * `);

			b.append(`${indent}/** ${doc} */\n`);
		}

		b.append(indent).appendAlias(
			propertyName(input ? field.inputName : field.outputName),
			field.span.start,
			field.span.end,
			MAPPED_FEATURES,
		);
		b.append(
			(input ? field.optionalInput : field.optionalOutput) ? '?: ' : ': ',
		);
		this.types.write(field.type, input);
		b.append(';\n');
	}

	/**
	 * Tells whether a model needs its own `.Input` interface instead of an alias of itself. The
	 * shapes differ when a field is optional on input only, renamed, output-only, or nests a named
	 * type (whose own `.Input` must be used).
	 *
	 * @param info - The model or TypedDict.
	 * @returns `true` when the input shape differs from the output shape.
	 */
	private needsInputShape(info: ModelInfo): boolean {
		if (info.bases.length) return true;

		return info.fields.some((field) => {
			if (
				field.optionalInput !== field.optionalOutput ||
				field.inputName !== field.outputName ||
				field.outputOnly
			)
				return true;

			let nested = false;

			walkType(field.type, (type) => {
				if (type.kind === 'ref') nested = true;
			});

			return nested;
		});
	}
}
