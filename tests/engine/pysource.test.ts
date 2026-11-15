// Random but valid Python from pysource-codegen (Ruff's fuzzing approach): the analyzer must
// never throw, and valid Python must never produce a syntax or indentation error. It needs uv and
// the network, so it only runs in the scheduled heavy job (`PYTONGUE_FUZZ=heavy`).
import { beforeAll, describe, expect, test } from 'bun:test';
import { mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

import { analyzePython } from '@/engine/analyze';
import { emitTypes } from '@/engine/emit/types';
import { fsHost, loadParser } from '@/engine/parser';

import { HEAVY, SEED } from '../harness/fuzz';
import { ROOT } from '../helpers';

const dir = join(ROOT, 'tests/.build/pysource');
const COUNT = Number(process.env.PYTONGUE_PYSOURCE_COUNT ?? 150);

/**
 * Valid Python that tree-sitter-python's grammar cannot parse (found by this very fuzz). They are
 * upstream gaps, so errors on exactly these lines are tolerated; anything else is a failure.
 */
const KNOWN_GRAMMAR_GAPS = [
	/\basync for\b.*\basync for\b/, // a generator expression nested in another one
	/^\s*@.*\)\[/, // PEP 614 decorators that subscript a call: `@f()[g()]`
];

beforeAll(async () => {
	await loadParser();
	rmSync(dir, { recursive: true, force: true });
	mkdirSync(dir, { recursive: true });

	if (!HEAVY) return;

	const run = Bun.spawnSync(
		[
			'uv',
			'run',
			'--quiet',
			'--no-project',
			'--python',
			'3.12',
			'--with',
			'pysource-codegen',
			'python',
			join(ROOT, 'tests/fixtures/pysource/generate.py'),
			String(SEED),
			String(COUNT),
			dir,
		],
		{ cwd: ROOT },
	);

	if (run.exitCode !== 0) throw new Error(run.stderr.toString());
}, 600_000);

describe.skipIf(!HEAVY)('pysource-codegen', () => {
	test(`${COUNT} random valid files analyze without errors`, () => {
		const files = readdirSync(dir).filter((f) => f.endsWith('.py'));

		expect(files.length).toBe(COUNT);

		for (const name of files) {
			const path = join(dir, name);
			const source = readFileSync(path, 'utf8');
			const info = analyzePython(source, path, fsHost);

			const lines = source.split('\n');
			const unexpected = info.syntaxErrors.filter((e) => {
				const line =
					lines[
						source.slice(0, e.span.start).split('\n').length - 1
					] ?? '';

				return !KNOWN_GRAMMAR_GAPS.some((gap) => gap.test(line));
			});

			// A failure here names the file, so the seed and index reproduce it.
			expect({ file: name, errors: unexpected }).toEqual({
				file: name,
				errors: [],
			});
			expect(() =>
				emitTypes(info, source, {
					strict: true,
					positionEncoding: 'utf-16',
				}),
			).not.toThrow();
		}
	}, 600_000);
});
