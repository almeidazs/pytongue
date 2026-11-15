// The real TypeScript 7.1 compiler runs the built content mapper (tsc --noEmit --runExternalCode).
import { beforeAll, expect, test } from 'bun:test';
import { join } from 'node:path';

import { buildPackage, linkPackage, ROOT } from '../helpers';

const tsc = join(ROOT, 'node_modules/.bin/tsc');

beforeAll(buildPackage);

/**
 * Type-checks a project through the mapper.
 *
 * @param project - The project path, relative to the repository root.
 * @returns The exit code and the diagnostic lines (continuation lines dropped).
 */
function check(project: string): { exitCode: number; output: string[] } {
	const dir = join(ROOT, project);

	linkPackage(dir);

	const proc = Bun.spawnSync(
		[tsc, '-p', dir, '--noEmit', '--runExternalCode'],
		{ cwd: ROOT },
	);
	const output = proc.stdout
		.toString()
		.split('\n')
		.filter((line) => line.trim() && !line.startsWith('  '));

	return { exitCode: proc.exitCode ?? -1, output };
}

test('the example type-checks', () => {
	const { exitCode, output } = check('examples/basic');

	expect(output).toEqual([]);
	expect(exitCode).toBe(0);
}, 60_000);

test('translated types match exact assertions', () => {
	const { exitCode, output } = check('tests/fixtures/types');

	expect(output).toEqual([]);
	expect(exitCode).toBe(0);
}, 60_000);

test('strict mode and syntax errors are reported at their Python spans', () => {
	expect(check('tests/fixtures/strict').output).toEqual([
		'tests/fixtures/strict/src/bad.py(4,7): error pytongue1002: Parameter `x` has no type hint, so it is typed as `unknown` (pytongue strict mode).',
		'tests/fixtures/strict/src/bad.py(8,10): error pytongue1005: Cannot resolve `numpy.ndarray`, so it is typed as `unknown` (pytongue strict mode).',
		'tests/fixtures/strict/src/bad.py(12,5): error pytongue1002: No return type hint, so it is typed as `unknown` (pytongue strict mode).',
		'tests/fixtures/strict/src/bad.py(12,12): error pytongue1001: Python syntax error: missing )',
	]);
}, 60_000);

test('TypeScript errors inside the virtual module land on the Python source; wrong assertions fail', () => {
	expect(check('tests/fixtures/semantic').output).toEqual([
		`tests/fixtures/semantic/src/bad.py(1,20): error TS2305: Module '"./other.py"' has no exported member 'Missing'.`,
		"tests/fixtures/semantic/src/index.ts(7,12): error TS2344: Type 'false' does not satisfy the constraint 'true'.",
		"tests/fixtures/semantic/src/index.ts(9,14): error TS2322: Type 'number' is not assignable to type 'string'.",
	]);
}, 60_000);
