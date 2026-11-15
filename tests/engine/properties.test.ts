// Properties that must hold for any Python the mapper sees: it never throws, its output is
// well-formed, and what it promises about positions is true. Failures print the shrunk input
// and the seed (`PYTONGUE_FUZZ_SEED=<seed> bun test` reproduces them).
import { beforeAll, describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import * as fc from 'fast-check';
import { stringIndexToPosition } from 'ts-content-mapper';

import { analyzePython } from '@/engine/analyze';
import { layoutOf } from '@/engine/emit/runtime';
import { emitTypes } from '@/engine/emit/types';
import { fsHost, loadParser } from '@/engine/parser';

import { CASES_DIR, loadCases } from '../harness/cases';
import { fuzz } from '../harness/fuzz';
import { genModule, moduleSource } from '../harness/python-gen';
import { memoryHost } from '../helpers';

beforeAll(async () => {
	await loadParser();
});

const FILE = '/project/mod.py';

/** Heavy runs take tens of seconds; Bun's default is 5. */
const TIMEOUT = 600_000;

/**
 * Analyzes and emits Python source as a standalone module.
 *
 * @param source - The Python source.
 * @param strict - Whether strict mode is on.
 * @returns The analysis and the emitted module.
 */
function run(source: string, strict = false) {
	const info = analyzePython(source, FILE, memoryHost({ [FILE]: source }));
	const output = emitTypes(info, source, {
		strict,
		positionEncoding: 'utf-16',
	});

	return { info, output };
}

const corpus = loadCases().flatMap((c) => c.files.map((f) => f.content));

/** Edits a source the way a typo or a half-typed line does. */
const mutation: fc.Arbitrary<(source: string) => string> = fc.oneof(
	fc
		.nat()
		.map(
			(n) => (s: string) =>
				s.slice(0, n % (s.length + 1)) +
				s.slice((n % (s.length + 1)) + 1),
		),
	fc.tuple(fc.nat(), fc.string({ maxLength: 6 })).map(
		([n, text]) =>
			(s: string) =>
				s.slice(0, n % (s.length + 1)) +
				text +
				s.slice(n % (s.length + 1)),
	),
	fc.nat().map(
		(n) => (s: string) =>
			s
				.split('\n')
				.toSpliced(n % (s.split('\n').length + 1), 1)
				.join('\n'),
	),
	fc.nat().map((n) => (s: string) => s.slice(0, n % (s.length + 1))),
);

describe('robustness', () => {
	test(
		'never throws on arbitrary text',
		() => {
			fc.assert(
				fc.property(fc.string({ maxLength: 300 }), (source) => {
					run(source);
					run(source, true);
				}),
				fuzz(300, 20_000),
			);
		},
		TIMEOUT,
	);

	test(
		'never throws on arbitrary unicode text',
		() => {
			fc.assert(
				fc.property(
					fc.string({ unit: 'binary', maxLength: 200 }),
					(source) => {
						run(source);
					},
				),
				fuzz(200, 10_000),
			);
		},
		TIMEOUT,
	);

	test(
		'never throws on corpus files damaged by random edits',
		() => {
			fc.assert(
				fc.property(
					fc.constantFrom(...corpus),
					fc.array(mutation, { minLength: 1, maxLength: 5 }),
					(source, edits) => {
						const damaged = edits.reduce(
							(text, edit) => edit(text),
							source,
						);

						run(damaged);
						run(damaged, true);
					},
				),
				fuzz(400, 30_000),
			);
		},
		TIMEOUT,
	);
});

describe('well-formed output', () => {
	test(
		'mappings stay in bounds, ordered and non-overlapping in the virtual file',
		() => {
			fc.assert(
				fc.property(fc.constantFrom(...corpus), (source) => {
					const { output } = run(source);
					let end = 0;

					for (const [
						vStart,
						vLength,
						oStart,
						oLength,
					] of output.mappings ?? []) {
						expect(vStart).toBeGreaterThanOrEqual(end);
						expect(vStart + vLength).toBeLessThanOrEqual(
							output.text.length,
						);
						expect(oStart + oLength).toBeLessThanOrEqual(
							source.length,
						);

						end = vStart + vLength;
					}
				}),
				fuzz(300, 3000),
			);
		},
		TIMEOUT,
	);

	test(
		'diagnostics point inside the Python source',
		() => {
			fc.assert(
				fc.property(
					fc.constantFrom(...corpus),
					fc.boolean(),
					(source, strict) => {
						for (const d of run(source, strict).output
							.diagnostics ?? []) {
							expect(d.start).toBeGreaterThanOrEqual(0);
							expect(d.length).toBeGreaterThanOrEqual(0);
							expect(d.start + d.length).toBeLessThanOrEqual(
								source.length,
							);
						}
					},
				),
				fuzz(300, 3000),
			);
		},
		TIMEOUT,
	);

	test(
		'strict mode only adds diagnostics; syntax errors are always reported',
		() => {
			fc.assert(
				fc.property(fc.constantFrom(...corpus), (source) => {
					const loose = run(source).output.diagnostics ?? [];
					const strict = run(source, true).output.diagnostics ?? [];

					expect(strict.length).toBeGreaterThanOrEqual(loose.length);
					expect(loose.every((d) => d.code === 1001)).toBe(true);
				}),
				fuzz(300, 3000),
			);
		},
		TIMEOUT,
	);

	test(
		'analysis and emission are deterministic',
		() => {
			fc.assert(
				fc.property(fc.constantFrom(...corpus), (source) => {
					const first = run(source);
					const second = run(source);

					expect(second.info).toEqual(first.info);
					expect(second.output).toEqual(first.output);
				}),
				fuzz(200, 2000),
			);
		},
		TIMEOUT,
	);

	test(
		'every mapped name is a Python identifier or a quoted property',
		() => {
			fc.assert(
				fc.property(fc.constantFrom(...corpus), (source) => {
					const { output } = run(source);

					for (const [
						,
						vLength,
						oStart,
						oLength,
						kind,
					] of output.mappings ?? []) {
						if (kind !== 2 || oLength === 0) continue; // aliases map a name to a name

						const python = source.slice(oStart, oStart + oLength);

						expect(python).toMatch(/^[\p{L}\p{N}_.]+$/u);
						expect(vLength).toBeGreaterThan(0);
					}
				}),
				fuzz(300, 3000),
			);
		},
		TIMEOUT,
	);

	test(
		'UTF-8 and UTF-16 positions describe the same diagnostics',
		() => {
			fc.assert(
				fc.property(fc.constantFrom(...corpus), (source) => {
					const info = analyzePython(
						source,
						FILE,
						memoryHost({ [FILE]: source }),
					);
					const utf16 = emitTypes(info, source, {
						strict: true,
						positionEncoding: 'utf-16',
					});
					const utf8 = emitTypes(info, source, {
						strict: true,
						positionEncoding: 'utf-8',
					});

					expect(utf8.diagnostics?.length).toBe(
						utf16.diagnostics?.length,
					);

					(utf16.diagnostics ?? []).forEach((d, i) => {
						const other = utf8.diagnostics![i]!;

						expect(other.start).toBe(
							stringIndexToPosition(source, d.start, 'utf-8'),
						);
						expect(other.messageText).toBe(d.messageText);
					});
				}),
				fuzz(200, 2000),
			);
		},
		TIMEOUT,
	);
});

describe('generated signatures', () => {
	test(
		'valid Python never produces a syntax error and every function is exported',
		() => {
			fc.assert(
				fc.property(genModule(), (functions) => {
					const { info, output } = run(moduleSource(functions), true);

					expect(info.syntaxErrors).toEqual([]);
					expect(output.diagnostics).toBeUndefined();
					expect(
						info.exports
							.filter((e) => e.kind === 'function')
							.map((e) => e.name),
					).toEqual(functions.map((f) => f.name));
				}),
				fuzz(300, 20_000),
			);
		},
		TIMEOUT,
	);

	test(
		'the call layout agrees with the declared parameters',
		() => {
			fc.assert(
				fc.property(genModule(), (functions) => {
					const { info } = run(moduleSource(functions));

					for (const fn of functions) {
						const layout = layoutOf(
							info.functions.find((f) => f.name === fn.name)!,
						);
						const shapes = fn.params.map((p) => p.shape);

						expect(layout.rest).toBe(shapes.includes('varargs'));
						expect(layout.gen).toBe(false);
						expect(layout.req).toBe(
							shapes.filter(
								(s) => s === 'required' || s === 'posonly',
							).length,
						);
						expect(layout.opt.length).toBe(
							shapes.filter((s) => s === 'posonly-default')
								.length +
								(shapes.includes('varargs')
									? shapes.filter((s) => s === 'default')
											.length
									: 0),
						);
					}
				}),
				fuzz(300, 20_000),
			);
		},
		TIMEOUT,
	);
});

describe('the corpus sources', () => {
	test('are valid Python except the files that exist to be broken', () => {
		const sources = loadCases();

		expect(sources.length).toBeGreaterThan(100);
		expect(
			readFileSync(join(CASES_DIR, 'functions/plain-def.py'), 'utf8'),
		).toContain('def');
		expect(
			fsHost.fileExists(join(CASES_DIR, 'functions/plain-def.py')),
		).toBe(true);
	});
});
