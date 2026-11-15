// Real uv, real Python workers, under Node (registerHooks) and Bun (Bun.plugin).
// Node defaults to `node` on PATH; set PYTONGUE_TEST_NODE to pin one (the package targets Node 24).
import { beforeAll, expect, test } from 'bun:test';
import { join } from 'node:path';

import { buildPackage, linkPackage, ROOT } from '../helpers';

const fixture = join(ROOT, 'tests/fixtures/runtime');
const example = join(ROOT, 'examples/basic');
const node = process.env.PYTONGUE_TEST_NODE ?? 'node';

beforeAll(() => {
	buildPackage();
	linkPackage(fixture);
	linkPackage(example);
});

/** What each scenario of `tests/fixtures/runtime/src/driver.ts` must print. */
const expected: Record<string, unknown> = {
	echo: { ok: true, value: { name: 'pen', qty: 1 } },
	validation: {
		ok: false,
		error: {
			class: 'PythonValidationError',
			pyType: 'ValidationError',
			errors: 1,
		},
	},
	exception: {
		ok: false,
		error: {
			class: 'PythonError',
			pyType: 'ValueError',
			message: 'ValueError: boom',
		},
	},
	nan: { ok: false, error: { class: 'PythonError', pyType: 'ValueError' } },
	'big-int': {
		ok: false,
		error: { class: 'PythonError', pyType: 'OverflowError' },
	},
	noisy: { ok: true, value: 42 },
	'date-in-out': { ok: true, value: '2026-11-16' },
	void: { ok: true },
	'async-concurrent': {
		ok: true,
		value: { tags: ['a', 'b', 'c'], concurrent: true },
	},
	'sync-fifo': {
		ok: true,
		value: {
			last: ['first', 'second', 'third'],
			thread: 'pytongue-sync_0',
		},
	},
	generator: { ok: true, value: [0, 1, 2, 3] },
	'generator-break-closes': {
		ok: true,
		value: { out: [0, 1, 2], closed: ['counter', 'forever'] },
	},
	'abandoned-iterator-closes': { ok: true, value: true },
	prefetch: { ok: true, value: { first: 0, produced: 3 } },
	'wrong-arguments': {
		ok: false,
		error: { class: 'TypeError', message: 'echo(): too many arguments' },
	},
	'real-package': { ok: true, value: { quadruple: 12, double: 10 } },
	crash: { ok: false, error: { class: 'PythonWorkerError', exitCode: 3 } },
	'after-crash-respawns': { ok: true, value: { name: 'again', qty: 1 } },
	'startup-failure': {
		ok: false,
		error: { class: 'PythonError', pyType: 'ModuleNotFoundError' },
	},
	'startup-failure-no-respawn': {
		ok: true,
		value: { fast: true, sameError: 'ModuleNotFoundError' },
	},
};

/**
 * Runs the scenario driver.
 *
 * @param command - The command line.
 * @param extraEnv - Extra environment variables.
 * @returns The driver's stderr and its results by scenario name.
 */
function drive(
	command: string[],
	extraEnv: Record<string, string> = {},
): { stderr: string; results: Map<string, unknown> } {
	const proc = Bun.spawnSync(command, {
		cwd: fixture,
		env: { ...process.env, PYTONGUE_PREFETCH: '3', ...extraEnv },
		timeout: 280_000,
	});
	const results = new Map<string, unknown>();

	for (const line of proc.stdout.toString().split('\n')) {
		if (!line.trim()) continue;

		const { case: name, ...rest } = JSON.parse(line);

		results.set(name, rest);
	}

	return { stderr: proc.stderr.toString(), results };
}

/**
 * Asserts every expected scenario result.
 *
 * @param results - The driver's results.
 */
function expectAll(results: Map<string, unknown>): void {
	for (const [name, want] of Object.entries(expected))
		expect({ name, got: results.get(name) }).toMatchObject({
			name,
			got: want as object,
		});
}

test('Node: every scenario', () => {
	const { results, stderr } = drive([
		node,
		'--expose-gc',
		'--import',
		'pytongue/register',
		'src/driver.ts',
	]);

	expectAll(results);
	// print() and raw writes to fd 1 reach stderr; the protocol on stdout stays clean.
	expect(stderr).toContain('print() goes to stderr');
	expect(stderr).toContain('a raw write to fd 1 goes to stderr too');
}, 300_000);

test('Bun: every scenario', () => {
	expectAll(
		drive(['bun', '--preload', 'pytongue/register', 'src/driver.ts'])
			.results,
	);
}, 300_000);

test('uv missing: a clear PythonWorkerError', () => {
	const { results } = drive(
		[node, '--import', 'pytongue/register', 'src/driver.ts', 'uv-missing'],
		{ PYTONGUE_UV: '/nonexistent/uv' },
	);

	expect(results.get('uv-missing')).toMatchObject({
		ok: false,
		error: {
			class: 'PythonWorkerError',
			message: expect.stringContaining('was not found. Install uv'),
		},
	});
}, 60_000);

test('the example runs the same under Node and Bun', () => {
	const output = 'Subtotal: $12\nTotal:    $10.8\n';

	const fromNode = Bun.spawnSync(
		[node, '--import', 'pytongue/register', 'src/main.ts'],
		{ cwd: example },
	);
	// Bun reads the preload from the example's bunfig.toml.
	const fromBun = Bun.spawnSync(['bun', 'src/main.ts'], { cwd: example });

	expect(fromNode.stdout.toString()).toBe(output);
	expect(fromBun.stdout.toString()).toBe(output);
}, 120_000);
