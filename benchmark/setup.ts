/**
 * Detects the runtimes, prepares what the tools need (npm packages, the Python venv, the
 * pytongue build) and gathers the machine description for the report.
 *
 * @module
 */
import { type SpawnSyncReturns, spawnSync } from 'node:child_process';
import {
	existsSync,
	lstatSync,
	mkdirSync,
	readFileSync,
	readlinkSync,
	rmSync,
	symlinkSync,
} from 'node:fs';
import { cpus, totalmem } from 'node:os';
import { join } from 'node:path';

import { BENCH_DIR, PYTHON, REPO_ROOT, UV } from './shared.ts';
import type { MachineInfo, ToolNeed } from './types.ts';

/** The Bun that runs the driver, used for the Bun cells and for installs. */
export const BUN = process.execPath;

/** The Node 24 install checked when `PYTONGUE_BENCH_NODE` is not set. */
const LINUXBREW_NODE = '/home/linuxbrew/.linuxbrew/opt/node@24/bin/node';

/** The `javascript` package version pythonia 1.2.6 pairs with (PyPI epoch 1). */
const JAVASCRIPT_PIP = 'javascript==1!1.2.6';

/** The Python every uv-started process uses, so all rows share one interpreter. */
export const UV_PYTHON = '3.12';

/** Why a requirement could not be met, per need; absent when it is satisfied. */
export type SetupFailures = Partial<Record<ToolNeed, string>>;

/**
 * Runs a command synchronously and returns its trimmed output.
 *
 * @param command - The executable.
 * @param args - Its arguments.
 * @param cwd - The working directory.
 * @returns The result with decoded output.
 */
function run(
	command: string,
	args: string[],
	cwd: string = BENCH_DIR,
): SpawnSyncReturns<string> {
	return spawnSync(command, args, {
		cwd,
		encoding: 'utf8',
		env: { ...process.env, UV_PYTHON },
	});
}

/**
 * Reduces a failed command to one explanatory line.
 *
 * @param result - The finished command.
 * @returns The last non-empty line of its output, or its exit status.
 */
function reason(result: SpawnSyncReturns<string>): string {
	const lines = `${result.stderr}\n${result.stdout}`
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean);

	return (
		result.error?.message ??
		lines.at(-1) ??
		`exited with status ${result.status}`
	);
}

/**
 * Finds a Node 24 binary: `PYTONGUE_BENCH_NODE`, the Linuxbrew `node@24`, or `node` on PATH.
 *
 * @returns The path and version, or the reason none qualified.
 */
export function resolveNode(): { path: string; version: string } | string {
	const candidates = [
		process.env.PYTONGUE_BENCH_NODE,
		LINUXBREW_NODE,
		'node',
	].filter((candidate): candidate is string => Boolean(candidate));
	const seen: string[] = [];

	for (const path of candidates) {
		const result = run(path, ['--version']);
		const version = result.stdout.trim();

		if (result.status === 0 && version.startsWith('v24.'))
			return { path, version };

		seen.push(`${path}: ${result.status === 0 ? version : reason(result)}`);
	}

	return `no Node 24 found (${seen.join('; ')}); set PYTONGUE_BENCH_NODE`;
}

/**
 * Installs the benchmark's npm packages when they are missing.
 *
 * @returns Why the install failed, or `undefined`.
 */
function ensureNpm(): string | undefined {
	if (existsSync(join(BENCH_DIR, 'node_modules', 'pyodide')))
		return undefined;

	const result = run(BUN, ['install']);

	return result.status === 0
		? undefined
		: `install failed: bun install: ${reason(result)}`;
}

/**
 * Points `benchmark/node_modules/pytongue` at the repository root, so the preload resolves
 * to the working tree and not to a published copy.
 *
 * @returns Why it could not be linked, or `undefined`.
 */
function linkPytongue(): string | undefined {
	const link = join(BENCH_DIR, 'node_modules', 'pytongue');

	try {
		mkdirSync(join(BENCH_DIR, 'node_modules'), { recursive: true });

		const stat = lstatSync(link, { throwIfNoEntry: false });

		if (stat?.isSymbolicLink() && readlinkSync(link) === '../..')
			return undefined;

		if (stat) rmSync(link, { recursive: true, force: true });

		symlinkSync('../..', link, 'dir');

		return undefined;
	} catch (error) {
		return `install failed: cannot link pytongue: ${(error as Error).message}`;
	}
}

/**
 * Builds pytongue's `dist/` when it is missing.
 *
 * @returns Why the build failed, or `undefined`.
 */
function ensureBuild(): string | undefined {
	if (existsSync(join(REPO_ROOT, 'dist', 'register.js'))) return undefined;

	const result = run(BUN, ['run', 'build'], REPO_ROOT);

	return result.status === 0 &&
		existsSync(join(REPO_ROOT, 'dist', 'register.js'))
		? undefined
		: `install failed: bun run build: ${reason(result)}`;
}

/**
 * Creates the Python 3.12 venv with the `javascript` package when it is missing.
 *
 * @returns Why it failed, or `undefined`.
 */
function ensureVenv(): string | undefined {
	if (!existsSync(PYTHON)) {
		const created = run(UV, [
			'venv',
			join(BENCH_DIR, '.venv'),
			'--python',
			UV_PYTHON,
		]);

		if (created.status !== 0)
			return `install failed: uv venv: ${reason(created)}`;
	}

	if (run(PYTHON, ['-c', 'import javascript']).status === 0) return undefined;

	const installed = run(UV, [
		'pip',
		'install',
		'--python',
		PYTHON,
		JAVASCRIPT_PIP,
	]);

	return installed.status === 0
		? undefined
		: `install failed: pip install ${JAVASCRIPT_PIP}: ${reason(installed)}`;
}

/**
 * Prepares everything the tools need, recording rather than throwing what fails.
 *
 * @returns The failure reason of each need that could not be met.
 */
export function ensureSetup(): SetupFailures {
	const failures: SetupFailures = {};
	const npm = ensureNpm();
	const link = linkPytongue();
	const build = ensureBuild();
	const venv = ensureVenv();

	if (npm) failures.npm = npm;

	if (venv) failures.venv = venv;

	if (build ?? link) failures.build = (build ?? link)!;

	return failures;
}

/**
 * Reads the `version` of an installed npm package.
 *
 * @param name - The package name, resolved from `benchmark/node_modules`.
 * @returns The version, or `not installed`.
 */
function npmVersion(name: string): string {
	try {
		const manifest = JSON.parse(
			readFileSync(
				join(BENCH_DIR, 'node_modules', name, 'package.json'),
				'utf8',
			),
		) as { version: string };

		return manifest.version;
	} catch {
		return 'not installed';
	}
}

/**
 * Returns the first line a command prints, or `unknown`.
 *
 * @param command - The executable.
 * @param args - Its arguments.
 * @returns The first output line.
 */
function firstLine(command: string, args: string[]): string {
	const result = run(command, args);

	return result.status === 0
		? (result.stdout.trim().split('\n')[0] ?? 'unknown')
		: 'unknown';
}

/**
 * Describes the working tree pytongue is measured at.
 *
 * @returns The package version, the short commit and whether the tree has changes.
 */
function pytongueVersion(): string {
	const manifest = JSON.parse(
		readFileSync(join(REPO_ROOT, 'package.json'), 'utf8'),
	) as { version: string };
	const commit = firstLine('git', [
		'-C',
		REPO_ROOT,
		'rev-parse',
		'--short',
		'HEAD',
	]);
	const dirty = run('git', [
		'-C',
		REPO_ROOT,
		'status',
		'--porcelain',
	]).stdout.trim();

	return `${manifest.version} (working tree at ${commit}${dirty ? ', uncommitted changes' : ''})`;
}

/**
 * Collects the hardware, OS and tool versions for the report.
 *
 * @param node - The Node binary and version the benchmark uses.
 * @returns The machine description.
 */
export function machineInfo(node: {
	path: string;
	version: string;
}): MachineInfo {
	const osRelease = existsSync('/etc/os-release')
		? (/PRETTY_NAME="?([^"\n]+)"?/.exec(
				readFileSync('/etc/os-release', 'utf8'),
			)?.[1] ?? '')
		: '';
	const kernel = firstLine('uname', ['-r']);
	const uvPython = firstLine(UV, [
		'run',
		'--quiet',
		'--no-project',
		'python',
		'--version',
	]);
	const web = firstLine(UV, [
		'run',
		'--quiet',
		'--no-project',
		'--with',
		'fastapi',
		'--with',
		'uvicorn',
		'python',
		'-c',
		"import importlib.metadata as m; print(f\"fastapi {m.version('fastapi')}, uvicorn {m.version('uvicorn')}, pydantic {m.version('pydantic')}\")",
	]);
	const javascript = firstLine(PYTHON, [
		'-c',
		"import importlib.metadata as m; print(m.version('javascript'))",
	]);

	return {
		cpu: cpus()[0]?.model.replace(/\s+/g, ' ') ?? 'unknown',
		cores: cpus().length,
		memoryGb: Math.round(totalmem() / 2 ** 30),
		os: `${osRelease || 'Linux'} (kernel ${kernel})`,
		versions: [
			['Node', `${node.version} (${node.path})`],
			['Bun', Bun.version],
			[
				'Python (venv: spawn per call, python-shell, pythonia, native)',
				firstLine(PYTHON, ['--version']).replace('Python ', ''),
			],
			[
				'Python (uv-started: pytongue, no-validation worker, FastAPI)',
				`${uvPython.replace('Python ', '')} (UV_PYTHON=${UV_PYTHON})`,
			],
			['uv', firstLine(UV, ['--version'])],
			['pytongue', pytongueVersion()],
			['python-shell', npmVersion('python-shell')],
			[
				'pythonia',
				`${npmVersion('pythonia')} (pip javascript ${javascript})`,
			],
			['pymport', npmVersion('pymport')],
			['pyodide', npmVersion('pyodide')],
			['FastAPI stack', web],
		],
	};
}

/**
 * Makes sure a directory exists.
 *
 * @param path - The directory.
 */
export function ensureDir(path: string): void {
	mkdirSync(path, { recursive: true });
}
