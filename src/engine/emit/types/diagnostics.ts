/**
 * Diagnostics the content mapper reports on the Python source.
 *
 * @module
 */
import {
	stringIndexToPosition,
	type ContentMapperDiagnostic,
	type PositionEncoding,
} from 'ts-content-mapper';

import { capitalize } from '@/shared';
import {
	DiagnosticCode,
	type Span,
	type SyntaxErrorInfo,
	type UnknownType,
} from '@/types/engine';

/** Builds mapper diagnostics in the position encoding TypeScript negotiated. */
export class DiagnosticsBuilder {
	private readonly diagnostics: ContentMapperDiagnostic[] = [];

	/**
	 * Creates a diagnostics builder.
	 *
	 * @param source - The Python source, for converting positions.
	 * @param encoding - The negotiated position encoding.
	 */
	constructor(
		private readonly source: string,
		private readonly encoding: PositionEncoding,
	) {}

	/**
	 * Adds syntax errors, which are always reported.
	 *
	 * @param errors - The syntax errors.
	 * @returns This builder.
	 */
	syntaxErrors(errors: SyntaxErrorInfo[]): this {
		for (const error of errors)
			this.add(error.message, error.span, DiagnosticCode.SyntaxError);

		return this;
	}

	/**
	 * Adds one error per `unknown`, for strict mode.
	 *
	 * @param unknowns - The `unknown` types written into the virtual module.
	 * @returns This builder.
	 */
	unknowns(unknowns: Iterable<UnknownType>): this {
		for (const type of unknowns)
			this.add(
				`${capitalize(type.reason)}, so it is typed as \`unknown\` (pytongue strict mode).`,
				type.span,
				type.code,
			);

		return this;
	}

	/**
	 * Returns the diagnostics collected so far.
	 *
	 * @returns The diagnostics, possibly empty.
	 */
	build(): ContentMapperDiagnostic[] {
		return this.diagnostics;
	}

	/**
	 * Adds one diagnostic.
	 *
	 * @param messageText - The message.
	 * @param span - Where, in JS string indices.
	 * @param code - The diagnostic code.
	 */
	private add(messageText: string, span: Span, code: number): void {
		const start = stringIndexToPosition(
			this.source,
			span.start,
			this.encoding,
		);
		const end = stringIndexToPosition(this.source, span.end, this.encoding);

		this.diagnostics.push({
			messageText,
			start,
			length: end - start,
			code,
		});
	}
}
