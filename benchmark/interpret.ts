/**
 * The interpretation bullets of `RESULTS.md`: every number in them is computed from the
 * measured results, so the text stays true when the benchmark is rerun.
 *
 * @module
 */
import { NATIVE_ID, num, ok } from './format.ts';
import type { ReportInput, RuntimeReport } from './format.ts';

/**
 * Reads the p50 latency of a tool.
 *
 * @param runtime - The runtime's results.
 * @param id - The tool id.
 * @returns Microseconds, or `undefined` when the tool did not run.
 */
function p50(
	runtime: RuntimeReport | undefined,
	id: string,
): number | undefined {
	return ok(runtime?.results[id]?.latency)?.p50;
}

/**
 * Reads the sequential throughput of a tool.
 *
 * @param runtime - The runtime's results.
 * @param id - The tool id.
 * @returns Calls per second, or `undefined` when the tool did not run.
 */
function seq(
	runtime: RuntimeReport | undefined,
	id: string,
): number | undefined {
	return ok(runtime?.results[id]?.throughput)?.sequential.opsPerSec;
}

/**
 * Reads the concurrent throughput of a tool.
 *
 * @param runtime - The runtime's results.
 * @param id - The tool id.
 * @returns Calls per second, or `undefined` when it did not run or is synchronous.
 */
function conc(
	runtime: RuntimeReport | undefined,
	id: string,
): number | undefined {
	return ok(runtime?.results[id]?.throughput)?.concurrent?.opsPerSec;
}

/**
 * Reads the median cold start of a tool.
 *
 * @param runtime - The runtime's results.
 * @param id - The tool id.
 * @returns Milliseconds, or `undefined` when the tool did not run.
 */
function cold(
	runtime: RuntimeReport | undefined,
	id: string,
): number | undefined {
	return ok(runtime?.results[id]?.cold)?.totalMs;
}

/**
 * Reads the median CPU-bound call of a tool.
 *
 * @param runtime - The runtime's results.
 * @param id - The tool id.
 * @returns Milliseconds, or `undefined` when the tool did not run.
 */
function cpu(
	runtime: RuntimeReport | undefined,
	id: string,
): number | undefined {
	return ok(runtime?.results[id]?.cpu)?.medianMs;
}

/**
 * Reads the median 1 MB echo of a tool.
 *
 * @param runtime - The runtime's results.
 * @param id - The tool id.
 * @returns Milliseconds, or `undefined` when the tool did not run.
 */
function big(
	runtime: RuntimeReport | undefined,
	id: string,
): number | undefined {
	return ok(runtime?.results[id]?.payload)?.sizes.find(
		(s) => s.label === '1 MB',
	)?.medianMs;
}

/**
 * Formats a ratio between two positive numbers as "N.NNx faster" or "slower".
 *
 * @param subject - The measurement being described.
 * @param reference - The measurement it is compared with.
 * @returns For example `2.1x slower than`.
 */
function versus(subject: number, reference: number): string {
	const ratio = subject / reference;

	return ratio >= 1
		? `${ratio.toFixed(1)}x slower than`
		: `${(1 / ratio).toFixed(1)}x faster than`;
}

/**
 * Like {@link versus}, but says "about as fast as" for ratios within 10%.
 *
 * @param subject - The measurement being described.
 * @param reference - The measurement it is compared with.
 * @returns For example `about as fast as`, or `1.3x faster than`.
 */
function sameOrVersus(subject: number, reference: number): string {
	const ratio = subject / reference;

	return ratio > 0.9 && ratio < 1.1
		? 'about as fast as'
		: versus(subject, reference);
}

/**
 * Computes the interpretation bullets from the results.
 *
 * @param input - The report input.
 * @returns Markdown bullets, each backed by numbers in the tables.
 */
export function interpretation(input: ReportInput): string[] {
	const bullets: string[] = [];
	const node = input.runtimes.find((r) => r.id === 'node');
	const bun = input.runtimes.find((r) => r.id === 'bun');
	const label = (id: string): string =>
		input.adapters.find((a) => a.id === id)?.label ?? id;

	for (const runtime of [node, bun]) {
		if (!runtime) continue;

		const pt = p50(runtime, 'pytongue');
		const raw = p50(runtime, 'pytongue-raw');

		if (pt !== undefined && raw !== undefined)
			bullets.push(
				`**What pytongue adds to a bare pipe (${runtime.label}).** The p50 of \`add(1, 2)\` is ${num(pt)} us for pytongue and ${num(raw)} us for the hand-written worker started the same way: pytongue is ${versus(pt, raw)} the bare bridge, ${num(Math.abs(pt - raw))} us ${pt >= raw ? 'more' : 'less'} per call, and ${num(seq(runtime, 'pytongue') ?? Number.NaN)} against ${num(seq(runtime, 'pytongue-raw') ?? Number.NaN)} sequential calls/s. That gap is everything the library does that the raw worker does not: encoding the call, Pydantic validation of the arguments and of the result, handing sync functions to a dedicated thread, and the generated module's promise bookkeeping. This benchmark does not separate those costs.`,
			);
	}

	const floor = p50(node, NATIVE_ID);
	const rawNode = p50(node, 'pytongue-raw');

	if (floor !== undefined && rawNode !== undefined)
		bullets.push(
			`**The floor.** Calling the function directly in Python takes ${num(floor)} us; the lightest IPC here (the no-validation worker) takes ${num(rawNode)} us on Node, ${(rawNode / floor).toFixed(0)}x more. Everything that crosses a process boundary pays a pipe round trip, JSON encoding and scheduling, so a call that does real work (the CPU scenario) hides that cost and a trivial call does not.`,
		);

	const others = ['python-shell', 'pythonia', 'fastapi'].filter(
		(id) => p50(node, id) !== undefined,
	);
	const ptNode = p50(node, 'pytongue');

	if (ptNode !== undefined && others.length)
		bullets.push(
			`**Against the other tools on Node.** pytongue's p50 is ${others
				.map(
					(id) =>
						`${versus(ptNode, p50(node, id)!)} ${label(id)} (${num(p50(node, id)!)} us)`,
				)
				.join(
					', ',
				)}. With 100 calls in flight pytongue reaches ${num(conc(node, 'pytongue') ?? Number.NaN)} calls/s${others
				.map((id) => ({ id, rate: conc(node, id) }))
				.filter((x) => x.rate !== undefined)
				.map((x) => `, ${label(x.id)} ${num(x.rate!)}`)
				.join(
					'',
				)}. pytongue serializes sync Python functions on one worker thread, so concurrency adds little for \`def\` functions; \`async def\` functions run concurrently.`,
		);

	const spawnCold = cold(node, 'spawn-per-call');
	const ptCold = cold(node, 'pytongue');
	const rawCold = cold(node, 'pytongue-raw');

	if (ptCold !== undefined)
		bullets.push(
			`**Cold start (Node).** pytongue takes ${num(ptCold)} ms to the first result${rawCold !== undefined ? `, ${num(rawCold)} ms for the no-validation worker` : ''}${spawnCold !== undefined ? ` and ${num(spawnCold)} ms for a single fresh Python process` : ''}: it pays \`uv run\`, the bridge import and the Pydantic import once, then amortizes them over the process lifetime. ${cold(node, 'pyodide') !== undefined ? `Pyodide spends ${num(cold(node, 'pyodide')!)} ms loading its WASM runtime before the first call. ` : ''}${cold(node, 'fastapi') !== undefined ? `FastAPI plus uvicorn needs ${num(cold(node, 'fastapi')!)} ms to boot and answer.` : ''}`,
		);

	const nativeCpu = cpu(node, NATIVE_ID);
	const wasmCpu = cpu(node, 'pyodide');

	if (nativeCpu !== undefined)
		bullets.push(
			`**CPU-bound work.** Bridged calls take ${[
				'pytongue',
				'pythonia',
				'python-shell',
			]
				.filter((id) => cpu(node, id) !== undefined)
				.map((id) => `${num(cpu(node, id)!)} ms (${label(id)})`)
				.join(
					', ',
				)} against ${num(nativeCpu)} ms native: the work runs in the same CPython, so the bridge disappears into the noise.${wasmCpu !== undefined ? ` Pyodide needs ${num(wasmCpu)} ms (${(wasmCpu / nativeCpu).toFixed(1)}x native) because it is a WASM build of a different Python version.` : ''}${cpu(node, 'pymport') !== undefined ? ` pymport, an embedded 3.12 build, takes ${num(cpu(node, 'pymport')!)} ms.` : ''}`,
		);

	const ranked = (
		[
			'pytongue',
			'pytongue-raw',
			'python-shell',
			'pythonia',
			'pymport',
			'pyodide',
			'fastapi',
			'spawn-per-call',
		] as const
	)
		.map((id) => ({ id, ms: big(node, id) }))
		.filter(
			(x): x is { id: (typeof x)['id']; ms: number } =>
				x.ms !== undefined,
		)
		.toSorted((a, b) => a.ms - b.ms);

	if (ranked.length > 1)
		bullets.push(
			`**Large payloads (Node, 1 MB).** ${ranked.map((x) => `${label(x.id)} ${num(x.ms)} ms`).join(', ')}. Serializing, piping and parsing a megabyte of JSON dominates, so the per-call overhead that separates the tools on small calls stops mattering; in-process tools instead pay to convert the whole object graph.`,
		);

	const apiNode = p50(node, 'fastapi');
	const apiBun = p50(bun, 'fastapi');

	if (apiNode !== undefined && apiBun !== undefined)
		bullets.push(
			`**The HTTP baseline depends on the client runtime.** The same FastAPI server answers \`add(1, 2)\` at a p50 of ${num(apiNode)} us when called with Node's \`fetch\` and ${num(apiBun)} us with Bun's (${sameOrVersus(apiBun, apiNode)} Node), so part of any HTTP number here is the client, not Python.`,
		);

	const missing = input.runtimes.flatMap((runtime) =>
		input.adapters
			.filter((a) => runtime.results[a.id]?.cold.kind === 'fail')
			.map((a) => `${label(a.id)} on ${runtime.label}`),
	);
	const ptBun = p50(bun, 'pytongue');

	if (ptNode !== undefined && ptBun !== undefined)
		bullets.push(
			`**Node versus Bun.** pytongue's p50 is ${num(ptNode)} us on Node and ${num(ptBun)} us on Bun (${sameOrVersus(ptBun, ptNode)} Node), with cold starts of ${num(cold(node, 'pytongue') ?? Number.NaN)} ms and ${num(cold(bun, 'pytongue') ?? Number.NaN)} ms.${missing.length ? ` Tools that do not run: ${missing.join('; ')}. pytongue and the plain \`child_process\`/\`fetch\` baselines are the ones that work on both.` : ''}`,
		);

	bullets.push(
		'**Caveats.** One machine, one run, loopback only, no CPU pinning: read ratios, not absolute numbers, expect noise between runs, and treat differences under about 1.3x (the CPU rows included, where native runs once at the start) as inconclusive. Pyodide is Python 3.14 in WASM and pymport bundles its own 3.12.2, so their CPU rows compare different interpreters. The pytongue worker is started by `uv run` while python-shell and pythonia use the venv interpreter directly, which shows in the cold-start column and nowhere else. FastAPI is measured with `async def` handlers, one uvicorn worker and the default `h11` HTTP stack, which favours it over a typical sync-handler deployment.',
	);

	return bullets;
}
