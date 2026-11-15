/**
 * Renders the results as `RESULTS.md`: machine info, one table per runtime and scenario, and
 * an interpretation whose numbers are computed from the same results.
 *
 * @module
 */
import {
	NATIVE_ID,
	num,
	ok,
	type ReportInput,
	type RuntimeReport,
} from './format.ts';
import { interpretation } from './interpret.ts';
import type { Outcome, ToolResults } from './types.ts';

/** A markdown row: the tool label and its cells. */
type Row = [label: string, ...cells: string[]];

/**
 * Wraps text in an inline code span that survives backticks and table pipes.
 *
 * @param text - The text to show verbatim.
 * @returns A markdown code span.
 */
function code(text: string): string {
	const runs = text.match(/`+/g) ?? [];
	const longest = Math.max(0, ...runs.map((run) => run.length));
	const fence = '`'.repeat(longest + 1);

	return `${fence} ${text.replaceAll('|', '\\|')} ${fence}`;
}

/**
 * Renders a markdown table.
 *
 * @param headers - The column headers.
 * @param rows - The rows.
 * @param numeric - Whether the columns after the first are right-aligned numbers.
 * @returns The table text.
 */
function table(headers: string[], rows: Row[], numeric = true): string {
	const align = headers.map((_, i) => (i > 0 && numeric ? '---:' : ':---'));

	return [
		`| ${headers.join(' | ')} |`,
		`| ${align.join(' | ')} |`,
		...rows.map((row) => `| ${row.join(' | ')} |`),
	].join('\n');
}

/**
 * Renders the cells of a tool whose outcome is not a success.
 *
 * @param cold - The tool's cold-start outcome, which decides whether it runs at all.
 * @param outcome - The scenario outcome that did not succeed.
 * @param width - The number of cells to fill.
 * @param verbose - Whether to print the error string (done once, in the cold-start table).
 * @returns The cells.
 */
function failureCells(
	cold: Outcome<unknown>,
	outcome: Outcome<unknown>,
	width: number,
	verbose: boolean,
): string[] {
	const error = outcome.kind === 'fail' ? outcome.error : '';
	let text: string;

	if (outcome.kind === 'timeout') text = 'timeout';
	else if (outcome.kind === 'skipped')
		text =
			cold.kind === 'timeout' ? 'timeout (cold start)' : 'does not run';
	else if (cold.kind === 'fail')
		text = !verbose
			? 'does not run'
			: error.startsWith('install failed')
				? error
				: `does not run: ${code(error)}`;
	else text = `error: ${code(error)}`;

	return [text, ...Array.from({ length: width - 1 }, () => '\u2014')];
}

/**
 * Builds the rows of one scenario table.
 *
 * @param input - The report input (for the tool order and labels).
 * @param runtime - The runtime being rendered.
 * @param pick - Selects the scenario's outcome from a tool's results.
 * @param width - The number of value columns.
 * @param cells - Renders the value cells of a successful outcome.
 * @returns One row per tool.
 */
function rowsFor<T>(
	input: ReportInput,
	runtime: RuntimeReport,
	pick: (results: ToolResults) => Outcome<T>,
	width: number,
	cells: (data: T) => string[],
): Row[] {
	const entries: [string, string][] = [
		[NATIVE_ID, 'Native Python (floor)'],
		...input.adapters.map((a): [string, string] => [a.id, a.label]),
	];
	const rows: Row[] = [];

	for (const [id, label] of entries) {
		const results = runtime.results[id];

		if (!results) continue;

		const outcome = pick(results);
		const data = ok(outcome);

		rows.push([
			label,
			...(data
				? cells(data)
				: failureCells(
						results.cold,
						outcome,
						width,
						outcome === results.cold,
					)),
		]);
	}

	return rows;
}

/**
 * Renders the five scenario tables of one runtime.
 *
 * @param input - The report input.
 * @param runtime - The runtime.
 * @returns The markdown section.
 */
function runtimeSection(input: ReportInput, runtime: RuntimeReport): string {
	const sample = Object.values(runtime.results)
		.map((r) => ok(r.payload))
		.find(Boolean);

	const bytes = (label: string): string => {
		const size = sample?.sizes.find((s) => s.label === label)?.bytes;

		return size ? `${label} (${num(size / 1000)} kB JSON)` : label;
	};

	const cold = rowsFor(
		input,
		runtime,
		(r) => r.cold,
		3,
		(d) => [
			num(d.totalMs),
			num(d.clientMs),
			`${num(d.totalMin)} to ${num(d.totalMax)}`,
		],
	);
	const latency = rowsFor(
		input,
		runtime,
		(r) => r.latency,
		5,
		(d) => [num(d.p50), num(d.p95), num(d.p99), num(d.mean), String(d.n)],
	);
	const throughput = rowsFor(
		input,
		runtime,
		(r) => r.throughput,
		3,
		(d) => [
			`${num(d.sequential.opsPerSec)}`,
			d.concurrent
				? `${num(d.concurrent.opsPerSec)} (${d.concurrent.inflight} in flight)`
				: 'n/a (synchronous)',
			d.sequential.n === 20_000 ? '20 000' : String(d.sequential.n),
		],
	);
	const payload = rowsFor(
		input,
		runtime,
		(r) => r.payload,
		3,
		(d) =>
			['1 KB', '100 KB', '1 MB'].map((label) => {
				const size = d.sizes.find((s) => s.label === label);

				return size
					? `${num(size.medianMs)}${size.n < 3 ? ` (n=${size.n})` : ''}`
					: 'n/a';
			}),
	);
	const native = ok(runtime.results[NATIVE_ID]?.cpu);
	const cpu = rowsFor(
		input,
		runtime,
		(r) => r.cpu,
		3,
		(d) => [
			num(d.medianMs),
			num(d.minMs),
			native ? `${(d.medianMs / native.medianMs).toFixed(2)}x` : 'n/a',
		],
	);

	return [
		`## ${runtime.label}`,
		'### 1. Cold start',
		'Wall time from spawning the benchmark process to the first `add(1, 2)` result (median of fresh processes, after one discarded warm-up run), and the part after the runtime booted (opening the tool and the first call).',
		table(
			[
				'Tool',
				'Total (ms)',
				'Client only (ms)',
				'Total, min to max (ms)',
			],
			cold,
		),
		'### 2. Small-call latency',
		'Sequential `add(1, 2)` after a warm-up, in microseconds. The in-process tools and spawn per call run fewer or more calls as shown.',
		table(
			['Tool', 'p50 (us)', 'p95 (us)', 'p99 (us)', 'mean (us)', 'calls'],
			latency,
		),
		'### 3. Throughput',
		'Sequential calls per second, and with up to 100 calls in flight. Spawn per call is capped to a few hundred calls.',
		table(
			[
				'Tool',
				'Sequential (calls/s)',
				'Concurrent (calls/s)',
				'Calls per variant',
			],
			throughput,
		),
		'### 4. Payload scaling',
		'Median latency in milliseconds of `echo(payload)`, an object holding a list of records. pymport and Pyodide convert to and from real Python objects instead of serializing JSON. A cell shows `(n=...)` when the tool was too slow for the full number of calls.',
		table(['Tool', bytes('1 KB'), bytes('100 KB'), bytes('1 MB')], payload),
		'### 5. CPU-bound',
		`A pure-Python loop (sum of i*i for i in range(${num(ok(runtime.results[NATIVE_ID]?.cpu)?.n ?? 5_000_000).replaceAll(',', ' ')})) called 5 times. Bridges run the same CPython, so they should match native; Pyodide runs a WASM build.`,
		table(
			['Tool', 'Median per call (ms)', 'Best call (ms)', 'vs native'],
			cpu,
		),
	].join('\n\n');
}

/**
 * Renders the whole report.
 *
 * @param input - The results and context.
 * @returns The markdown document.
 */
export function renderReport(input: ReportInput): string {
	const minutes = input.elapsedSeconds / 60;
	const info = new Map<string, string>();

	for (const runtime of input.runtimes)
		for (const adapter of input.adapters) {
			const text = ok(runtime.results[adapter.id]?.cold)?.info;

			if (text) info.set(adapter.id, text);
		}

	const failed = input.runtimes.flatMap((runtime) =>
		input.adapters.flatMap((adapter) => {
			const cold = runtime.results[adapter.id]?.cold;

			return cold?.kind === 'fail'
				? [
						`- **${adapter.label}** on ${runtime.label}: ${cold.error.startsWith('install failed') ? cold.error : code(cold.error)}`,
					]
				: [];
		}),
	);

	return (
		[
			'# Benchmark results',
			`Calling Python from Node 24 and Bun, measured on ${input.date}${input.quick ? ' in **quick mode** (reduced iteration counts, not comparable with a full run)' : ''}${input.partial && !input.quick ? ' for a subset of the tools' : ''}. The whole run took ${minutes < 1 ? `${Math.round(input.elapsedSeconds)} s` : `${minutes.toFixed(1)} min`}.`,
			'Generated by `bun run bench`; do not edit by hand. See [README.md](./README.md) for how to read it.',
			'## Machine',
			table(
				['', ''],
				[
					[
						'CPU',
						`${input.machine.cpu} (${input.machine.cores} threads)`,
					],
					['Memory', `${input.machine.memoryGb} GB`],
					['OS', input.machine.os],
					...input.machine.versions.map(([name, version]): Row => [
						name,
						version,
					]),
				],
				false,
			),
			'## Tools',
			input.adapters
				.map(
					(a) =>
						`- **${a.label}**: ${a.note}${info.has(a.id) ? ` (${info.get(a.id)})` : ''}`,
				)
				.join('\n') +
				"\n- **Native Python (floor)**: the same functions called directly in-process by a Python script timed with `time.perf_counter_ns`; one run, shown in both runtimes' tables for reference.",
			...(failed.length
				? ['### Tools that do not run', failed.join('\n')]
				: []),
			...input.runtimes.map((runtime) => runtimeSection(input, runtime)),
			'## Interpretation',
			interpretation(input)
				.map((bullet) => `- ${bullet}`)
				.join('\n'),
			'## How to reproduce',
			`\`bun install --cwd benchmark && bun run bench\` (needs Node 24, Bun, uv and network access for the first run; add \`-- --quick\` for a fast smoke run or \`-- --only pytongue\` for one tool; per-cell timeout ${input.timeoutSeconds} s). See [README.md](./README.md).`,
		].join('\n\n') + '\n'
	);
}
