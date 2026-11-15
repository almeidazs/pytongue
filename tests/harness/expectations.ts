/**
 * Inline diagnostic expectations, mypy style: `# E:7 pytongue1002` at the end of a line expects
 * that diagnostic on that line (at that column, when given). Files named `valid*` must say
 * `# should not generate diagnostics` and produce none (Biome's rule), so a fixture's intent is
 * always written in the fixture itself.
 *
 * @module
 */
import type { ContentMapperDiagnostic } from 'ts-content-mapper';

import { position } from './render';

/** One expected diagnostic. */
export interface Expectation {
	/** 1-based line. */
	line: number;
	/** 1-based column, when the comment gives one. */
	column: number | undefined;
	/** The code, such as `pytongue1002`. */
	code: string;
}

const EXPECTATION = /#\s*E(?::(\d+))?\s+(pytongue\d+)/g;

/** The comment `valid*` fixtures must carry. */
export const NO_DIAGNOSTICS = '# should not generate diagnostics';

/**
 * Reads the expectations of a Python file.
 *
 * @param source - The Python source.
 * @returns The expectations, in source order.
 */
export function parseExpectations(source: string): Expectation[] {
	return source.split('\n').flatMap((text, index) =>
		[...text.matchAll(EXPECTATION)].map((match) => ({
			line: index + 1,
			column: match[1] ? Number(match[1]) : undefined,
			code: match[2]!,
		})),
	);
}

/**
 * Lists the mismatches between expected and actual diagnostics.
 *
 * @param source - The Python source (expectations are read from it).
 * @param diagnostics - The actual diagnostics.
 * @returns Human-readable problems; empty when everything matches.
 */
export function checkExpectations(
	source: string,
	diagnostics: readonly ContentMapperDiagnostic[],
): string[] {
	const problems: string[] = [];
	const remaining = parseExpectations(source);

	for (const diagnostic of diagnostics) {
		const [line, column] = position(source, diagnostic.start)
			.split(':')
			.map(Number);
		const code = `pytongue${diagnostic.code}`;
		const index = remaining.findIndex(
			(e) =>
				e.line === line &&
				e.code === code &&
				(e.column === undefined || e.column === column),
		);

		if (index === -1)
			problems.push(
				`unexpected ${code} at ${line}:${column}: ${diagnostic.messageText}`,
			);
		else remaining.splice(index, 1);
	}

	for (const e of remaining)
		problems.push(
			`missing ${e.code} at ${e.line}${e.column ? `:${e.column}` : ''}`,
		);

	return problems;
}
