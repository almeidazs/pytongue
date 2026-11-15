import { expect } from 'bun:test';
/**
 * Golden-file baselines, TypeScript style: expected output lives in
 * `tests/baselines/reference/`, every run writes what it produced to `tests/baselines/local/`
 * (gitignored), and `UPDATE_BASELINES=1 bun test` accepts the new output.
 *
 * @module
 */
import {
	existsSync,
	mkdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';

import { ROOT } from '../helpers';

/** Accepted baselines. */
export const REFERENCE_DIR = join(ROOT, 'tests/baselines/reference');

/** What the last run produced, for `git diff --no-index reference local`. */
export const LOCAL_DIR = join(ROOT, 'tests/baselines/local');

/** Whether this run accepts its output as the new reference. */
export const UPDATING = process.env.UPDATE_BASELINES === '1';

/**
 * Compares output with its reference baseline, or writes the reference when updating.
 *
 * @param name - The baseline path, relative to the reference directory.
 * @param actual - The output.
 */
export function expectBaseline(name: string, actual: string): void {
	const reference = join(REFERENCE_DIR, name);
	const local = join(LOCAL_DIR, name);

	mkdirSync(dirname(local), { recursive: true });
	writeFileSync(local, actual);

	if (UPDATING) {
		mkdirSync(dirname(reference), { recursive: true });
		writeFileSync(reference, actual);

		return;
	}

	if (!existsSync(reference))
		throw new Error(
			`Missing baseline ${name}. Review tests/baselines/local/${name}, then run UPDATE_BASELINES=1 bun test.`,
		);

	expect(actual).toBe(readFileSync(reference, 'utf8'));
}

/**
 * Removes a reference baseline (used when updating, for outputs a case no longer produces).
 *
 * @param name - The baseline path, relative to the reference directory.
 */
export function deleteBaseline(name: string): void {
	rmSync(join(REFERENCE_DIR, name), { force: true });
}
