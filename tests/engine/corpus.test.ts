// The fixture corpus: every case in tests/cases/ is analyzed and emitted, its inline `# E:`
// expectations are checked, and its output is compared with golden baselines.
import { beforeAll, describe, expect, test } from 'bun:test';
import { readdirSync } from 'node:fs';
import { basename, join, relative, sep } from 'node:path';

import { analyzePython } from '@/engine/analyze';
import { emitTypes } from '@/engine/emit/types';
import { fsHost, loadParser } from '@/engine/parser';

import {
	deleteBaseline,
	expectBaseline,
	REFERENCE_DIR,
	UPDATING,
} from '../harness/baseline';
import {
	baselineName,
	BUILD_DIR,
	CASE_FILTER,
	loadCases,
	materialize,
} from '../harness/cases';
import { checkExpectations, NO_DIAGNOSTICS } from '../harness/expectations';
import { renderDiagnostics, renderMappings } from '../harness/render';

const cases = loadCases();

beforeAll(async () => {
	await loadParser();
});

describe('corpus', () => {
	test.each(cases.map((c) => [c.id, c] as const))('%s', (_id, testCase) => {
		const root = join(
			BUILD_DIR,
			'cases',
			testCase.strict ? 'strict' : 'default',
		);
		const dir = materialize(root, testCase);

		for (const file of testCase.files) {
			const path = join(dir, file.name);
			const info = analyzePython(file.content, path, fsHost);
			const output = emitTypes(info, file.content, {
				strict: testCase.strict,
				positionEncoding: 'utf-16',
			});
			const diagnostics = output.diagnostics ?? [];

			expect(checkExpectations(file.content, diagnostics)).toEqual([]);

			if (basename(testCase.id).startsWith('valid')) {
				expect(file.content).toContain(NO_DIAGNOSTICS);
				expect(diagnostics).toEqual([]);
			}

			expectBaseline(
				baselineName(testCase, file.name, '.mts'),
				output.text,
			);
			expectBaseline(
				baselineName(testCase, file.name, '.diagnostics.txt'),
				renderDiagnostics(file.name, file.content, diagnostics),
			);
			expectBaseline(
				baselineName(testCase, file.name, '.mappings.txt'),
				renderMappings(output.text, file.content, output.mappings),
			);
		}
	});

	// Only meaningful over the whole corpus.
	test.skipIf(CASE_FILTER !== '')(
		'every baseline belongs to an existing case',
		() => {
			const ids = new Set(cases.map((c) => c.id));
			const dir = join(REFERENCE_DIR, 'cases');
			const orphans = listFiles(dir)
				.map((path) => relative(dir, path).split(sep).join('/'))
				// A baseline belongs to a case when it is `<id>.<ext>` or `<id>/<file>.<ext>`.
				.filter(
					(name) =>
						![...ids].some(
							(id) =>
								name.startsWith(`${id}.`) ||
								name.startsWith(`${id}/`),
						),
				);

			if (UPDATING)
				for (const name of orphans) deleteBaseline(`cases/${name}`);
			else expect(orphans).toEqual([]);
		},
	);
});

/**
 * Lists the files under a directory, recursively.
 *
 * @param dir - The directory.
 * @returns Absolute paths; empty when the directory does not exist.
 */
function listFiles(dir: string): string[] {
	try {
		return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
			entry.isDirectory()
				? listFiles(join(dir, entry.name))
				: [join(dir, entry.name)],
		);
	} catch {
		return [];
	}
}
