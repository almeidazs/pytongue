/* oxlint-disable no-await-in-loop -- the benchmark measures calls made one after another */
/**
 * The benchmark driver: `bun run bench [--quick] [--only <tool>[,<tool>]] [--out <file>]`.
 *
 * Every (tool x runtime x scenario) cell runs in its own child process, so a crash fails only
 * that cell. The driver collects the children's JSON lines, aggregates them and writes
 * `RESULTS.md`.
 *
 * @module
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { type CellEnd, type CellSpec, runCell } from './cell.ts';
import { NATIVE_ID, type RuntimeReport } from './format.ts';
import { renderReport } from './report.ts';
import {
	BUN,
	type SetupFailures,
	UV_PYTHON,
	ensureSetup,
	machineInfo,
	resolveNode,
} from './setup.ts';
import { BENCH_DIR, PYTHON, PY_DIR, median } from './shared.ts';
import { adapters } from './tools/index.ts';
import type {
	Adapter,
	ChildResult,
	ColdResult,
	ColdSummary,
	Outcome,
	RuntimeId,
	ScenarioId,
	ToolResults,
} from './types.ts';

/** Command line options. */
interface Options {
	quick: boolean;
	only: string[];
	out: string | undefined;
}

/** How to launch a child for a tool, per runtime. */
interface Target {
	/** Builds the command line of one cell. */
	spec(scenario: ScenarioId): CellSpec;
}

const SCENARIOS: Exclude<ScenarioId, 'cold'>[] = [
	'latency',
	'throughput',
	'payload',
	'cpu',
];

/**
 * Parses the command line, ignoring the `--` that `bun run bench -- --quick` may pass along.
 *
 * @param argv - The arguments after the script name.
 * @returns The options.
 */
function parseArgs(argv: string[]): Options {
	const options: Options = { quick: false, only: [], out: undefined };
	const args = argv.filter((arg) => arg !== '--');

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];

		if (arg === '--quick') options.quick = true;
		else if (arg === '--only')
			options.only.push(...(args[++i] ?? '').split(',').filter(Boolean));
		else if (arg === '--out') options.out = args[++i];
		else throw new Error(`unknown argument ${arg}`);
	}

	return options;
}

/**
 * Takes the first line of a message.
 *
 * @param text - A possibly multi-line message.
 * @returns Its first non-empty line.
 */
function oneLine(text: string): string {
	return (
		text
			.split('\n')
			.find((line) => line.trim())
			?.trim() ?? text
	);
}

/**
 * Turns how a cell ended into a stored outcome.
 *
 * @param end - The cell's end.
 * @returns The outcome, with the child's data on success.
 */
function toOutcome(end: CellEnd): Outcome<unknown> {
	if (end.kind === 'timeout') return { kind: 'timeout' };

	if (end.kind === 'crash')
		return { kind: 'fail', error: oneLine(end.error) };

	const result: ChildResult = end.result;

	return result.status === 'ok'
		? { kind: 'ok', data: result.data }
		: { kind: 'fail', error: oneLine(result.error) };
}

/**
 * Measures the cold start: one discarded warm-up run (so uv and the filesystem caches are
 * warm and any one-time download is out of the way), then fresh processes.
 *
 * @param target - How to launch the tool.
 * @param quick - Whether to use fewer runs.
 * @returns The medians, or why the tool does not start.
 */
async function measureCold(
	target: Target,
	quick: boolean,
): Promise<Outcome<ColdSummary>> {
	const runs = quick ? 2 : 5;
	const totals: number[] = [];
	const clients: number[] = [];
	let info: string | undefined;

	for (let i = 0; i <= runs; i++) {
		const end = await runCell(target.spec('cold'));
		const outcome = toOutcome(end);

		if (outcome.kind !== 'ok') return outcome as Outcome<ColdSummary>;

		if (end.kind !== 'result' || end.firstMs === undefined)
			return { kind: 'fail', error: 'no first-result event' };

		if (i === 0) continue; // warm-up

		const data = outcome.data as ColdResult;

		totals.push(end.firstMs);
		clients.push(data.clientMs);
		info ??= data.info;
	}

	return {
		kind: 'ok',
		data: {
			runs,
			totalMs: median(totals),
			totalMin: Math.min(...totals),
			totalMax: Math.max(...totals),
			clientMs: median(clients),
			info,
		},
	};
}

/**
 * Measures every scenario of one tool on one runtime.
 *
 * @param label - Progress label.
 * @param target - How to launch the tool.
 * @param quick - Whether to use the reduced iteration counts.
 * @returns The tool's results; when it does not start, the other scenarios are skipped.
 */
async function measureTool(
	label: string,
	target: Target,
	quick: boolean,
): Promise<ToolResults> {
	const started = performance.now();
	const cold = await measureCold(target, quick);

	log(label, 'cold', cold, started);

	const skipped: Outcome<never> = {
		kind: 'skipped',
		error: cold.kind === 'fail' ? cold.error : 'cold start timed out',
	};
	const results: ToolResults = {
		cold,
		latency: skipped,
		throughput: skipped,
		payload: skipped,
		cpu: skipped,
	};

	if (cold.kind !== 'ok') return results;

	for (const scenario of SCENARIOS) {
		const began = performance.now();
		const outcome = toOutcome(await runCell(target.spec(scenario)));

		(results as unknown as Record<string, Outcome<unknown>>)[scenario] =
			outcome;
		log(label, scenario, outcome, began);
	}

	return results;
}

/**
 * Prints one progress line.
 *
 * @param label - Which tool and runtime.
 * @param scenario - The scenario just measured.
 * @param outcome - Its outcome.
 * @param since - When the scenario started.
 */
function log(
	label: string,
	scenario: string,
	outcome: Outcome<unknown>,
	since: number,
): void {
	const seconds = ((performance.now() - since) / 1000).toFixed(1);
	const status =
		outcome.kind === 'ok'
			? 'ok'
			: outcome.kind === 'fail'
				? `FAIL ${outcome.error.slice(0, 100)}`
				: outcome.kind;

	console.log(
		`  ${label.padEnd(34)} ${scenario.padEnd(11)} ${status} (${seconds}s)`,
	);
}

/**
 * Builds the launcher of a JavaScript tool on a runtime.
 *
 * @param runtime - The runtime's binary and the flags that load the pytongue preload.
 * @param adapter - The tool.
 * @param quick - Whether children use the reduced iteration counts.
 * @param env - The children's environment.
 * @param timeoutMs - The per-cell timeout.
 * @returns The target.
 */
function jsTarget(
	runtime: { command: string; preload: string[] },
	adapter: Adapter,
	quick: boolean,
	env: NodeJS.ProcessEnv,
	timeoutMs: number,
): Target {
	return {
		spec: (scenario) => ({
			command: runtime.command,
			args: [
				...(adapter.id === 'pytongue' ? runtime.preload : []),
				join(BENCH_DIR, 'child.ts'),
				adapter.id,
				scenario,
				...(quick ? ['--quick'] : []),
			],
			cwd: BENCH_DIR,
			env,
			timeoutMs,
		}),
	};
}

/**
 * Builds the launcher of the native-Python floor.
 *
 * @param quick - Whether to use the reduced iteration counts.
 * @param env - The environment.
 * @param timeoutMs - The per-cell timeout.
 * @returns The target.
 */
function nativeTarget(
	quick: boolean,
	env: NodeJS.ProcessEnv,
	timeoutMs: number,
): Target {
	return {
		spec: (scenario) => ({
			command: PYTHON,
			args: [
				join(PY_DIR, 'native.py'),
				scenario,
				...(quick ? ['--quick'] : []),
			],
			cwd: PY_DIR,
			env,
			timeoutMs,
		}),
	};
}

/**
 * Builds the results of a tool that cannot be launched at all (its install failed).
 *
 * @param error - Why.
 * @returns A cold-start failure with the other scenarios skipped.
 */
function unavailable(error: string): ToolResults {
	const skipped: Outcome<never> = { kind: 'skipped', error };

	return {
		cold: { kind: 'fail', error },
		latency: skipped,
		throughput: skipped,
		payload: skipped,
		cpu: skipped,
	};
}

/**
 * Returns the first failed requirement of a tool.
 *
 * @param adapter - The tool.
 * @param failures - The setup failures.
 * @returns The failure text, or `undefined` when the tool can be launched.
 */
function missingNeed(
	adapter: Adapter,
	failures: SetupFailures,
): string | undefined {
	for (const need of adapter.needs) if (failures[need]) return failures[need];

	return undefined;
}

/** Runs the whole benchmark and writes the report. */
async function main(): Promise<void> {
	const options = parseArgs(process.argv.slice(2));
	const started = performance.now();
	const timeoutSeconds = Number(process.env.PYTONGUE_BENCH_TIMEOUT ?? 120);
	const timeoutMs = timeoutSeconds * 1000;
	const selected = options.only.length
		? adapters.filter((adapter) => options.only.includes(adapter.id))
		: adapters;
	const unknown = options.only.filter(
		(id) =>
			id !== NATIVE_ID && !adapters.some((adapter) => adapter.id === id),
	);

	if (unknown.length)
		throw new Error(
			`unknown tool ${unknown.join(', ')}; choose from ${adapters.map((a) => a.id).join(', ')}`,
		);

	console.log('Preparing (npm packages, venv, pytongue build)...');

	const node = resolveNode();
	const failures = ensureSetup();

	for (const [need, text] of Object.entries(failures))
		console.log(`  ${need}: ${text}`);

	if (typeof node === 'string') console.log(`  node: ${node}`);

	const env: NodeJS.ProcessEnv = {
		...process.env,
		UV_PYTHON,
		PYTONGUE_BENCH_PYTHON: PYTHON,
	};
	const preload = ['pytongue/register'];
	const runtimes: {
		id: RuntimeId;
		label: string;
		command: string;
		flags: string[];
	}[] = [
		{
			id: 'node',
			label:
				typeof node === 'string'
					? 'Node 24'
					: `Node ${node.version.slice(1)}`,
			command: typeof node === 'string' ? 'node' : node.path,
			flags: ['--import', ...preload],
		},
		{
			id: 'bun',
			label: `Bun ${Bun.version}`,
			command: BUN,
			flags: ['--preload', ...preload],
		},
	];

	console.log('Collecting machine info...');

	const machine = machineInfo(
		typeof node === 'string' ? { path: 'not found', version: node } : node,
	);

	console.log(`\nNative Python (floor)`);

	const native = await measureTool(
		'native python',
		nativeTarget(options.quick, env, timeoutMs),
		options.quick,
	);
	const reports: RuntimeReport[] = [];

	for (const runtime of runtimes) {
		console.log(`\n${runtime.label}`);

		const results: Record<string, ToolResults> = { [NATIVE_ID]: native };

		for (const adapter of selected) {
			const label = `${adapter.id} / ${runtime.id}`;
			const missing =
				runtime.id === 'node' && typeof node === 'string'
					? `does not run: ${node}`
					: missingNeed(adapter, failures);

			if (missing) {
				results[adapter.id] = unavailable(missing);
				console.log(`  ${label.padEnd(34)} unavailable: ${missing}`);

				continue;
			}

			results[adapter.id] = await measureTool(
				label,
				jsTarget(
					{ command: runtime.command, preload: runtime.flags },
					adapter,
					options.quick,
					env,
					timeoutMs,
				),
				options.quick,
			);
		}

		reports.push({ id: runtime.id, label: runtime.label, results });
	}

	const elapsedSeconds = (performance.now() - started) / 1000;
	const partial = options.quick || options.only.length > 0;
	const out =
		options.out ??
		join(BENCH_DIR, partial ? 'RESULTS.partial.md' : 'RESULTS.md');

	writeFileSync(
		out,
		renderReport({
			date: new Date().toISOString().slice(0, 10),
			quick: options.quick,
			partial,
			elapsedSeconds,
			machine,
			adapters: selected,
			runtimes: reports,
			timeoutSeconds,
		}),
	);
	console.log(`\nWrote ${out} in ${(elapsedSeconds / 60).toFixed(1)} min`);
}

await main();
