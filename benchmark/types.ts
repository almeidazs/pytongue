/**
 * Shared shapes of the benchmark: tool adapters, scenario results and the driver's outcomes.
 *
 * @module
 */

/** A runtime the JavaScript children run on. */
export type RuntimeId = 'node' | 'bun';

/** One of the five measured scenarios. */
export type ScenarioId = 'cold' | 'latency' | 'throughput' | 'payload' | 'cpu';

/** The JSON object the payload scenario echoes: a list of records. */
export interface Payload {
	records: Record<string, unknown>[];
}

/** One open connection to a tool, exposing the three benchmarked Python functions. */
export interface Session {
	/** Short facts the tool reports about itself (for example its embedded Python version). */
	info?: string;
	/** Calls `add(a, b)`; in-process tools return the value directly. */
	add(a: number, b: number): number | Promise<number>;
	/** Calls `echo(payload)`, which returns its argument unchanged. */
	echo(payload: Payload): unknown;
	/** Calls `cpu(n)`, the pure-Python sum of squares. */
	cpu(n: number): number | Promise<number>;
	/** Stops everything the session started. */
	close(): Promise<void>;
}

/** Caps on iteration counts, for tools where one call costs a whole process start. */
export interface Limits {
	/** Maximum timed calls of the latency scenario. */
	latencyCalls?: number;
	/** Maximum warm-up calls of the latency scenario. */
	warmupCalls?: number;
	/** Maximum calls of each throughput variant. */
	throughputCalls?: number;
	/** Maximum timed calls of the 1 MB payload (and then it is not warmed up). */
	largePayloadCalls?: number;
}

/** How a tool is wired to Python, which decides how its row is explained. */
export type ToolKind = 'bridge' | 'in-process' | 'wasm' | 'http' | 'baseline';

/** What the tool needs installed before it can run. */
export type ToolNeed = 'npm' | 'venv' | 'build';

/** A tool under test: metadata for the driver plus the way to open a session. */
export interface Adapter {
	/** Stable id, also the file name under `tools/` and the `--only` value. */
	id: string;
	/** Row label in the report. */
	label: string;
	/** How the tool reaches Python. */
	kind: ToolKind;
	/** True when calls block the event loop, so a concurrent variant is meaningless. */
	synchronous: boolean;
	/** One sentence on how the tool is wired up, shown in the report's tool list. */
	note: string;
	/** What has to be installed for the tool to run. */
	needs: ToolNeed[];
	/** Iteration caps, when a full-size run would take too long. */
	limits?: Limits;
	/** Opens a session; the first thing the cold-start scenario times. */
	open(): Promise<Session>;
}

/** Latency percentiles in microseconds. */
export interface LatencyResult {
	n: number;
	warmup: number;
	p50: number;
	p95: number;
	p99: number;
	mean: number;
}

/** Calls per second of one throughput variant. */
export interface Rate {
	n: number;
	opsPerSec: number;
	/** The number of calls in flight (1 for the sequential variant). */
	inflight: number;
}

/** The throughput scenario: sequential, and concurrent unless the tool is synchronous. */
export interface ThroughputResult {
	sequential: Rate;
	concurrent: Rate | null;
}

/** The median latency of one payload size. */
export interface PayloadSize {
	label: string;
	bytes: number;
	n: number;
	medianMs: number;
}

/** The payload-scaling scenario. */
export interface PayloadResult {
	sizes: PayloadSize[];
}

/** The CPU-bound scenario. */
export interface CpuResult {
	n: number;
	calls: number;
	medianMs: number;
	minMs: number;
}

/** What a cold-start child reports about its own first call. */
export interface ColdResult {
	/** From just before opening the session to the first `add` result, in milliseconds. */
	clientMs: number;
	info?: string;
}

/** The final line a child prints. */
export type ChildResult =
	| { status: 'ok'; data: unknown }
	| { status: 'fail'; stage: string; error: string };

/** A cell's result as the driver stores it. */
export type Outcome<T> =
	| { kind: 'ok'; data: T }
	| { kind: 'fail'; error: string }
	| { kind: 'timeout' }
	| { kind: 'skipped'; error: string };

/** The aggregated cold-start result of several fresh processes. */
export interface ColdSummary {
	runs: number;
	totalMs: number;
	totalMin: number;
	totalMax: number;
	clientMs: number;
	info?: string;
}

/** Every scenario of one tool on one runtime. */
export interface ToolResults {
	cold: Outcome<ColdSummary>;
	latency: Outcome<LatencyResult>;
	throughput: Outcome<ThroughputResult>;
	payload: Outcome<PayloadResult>;
	cpu: Outcome<CpuResult>;
}

/** Versions and hardware shown at the top of the report. */
export interface MachineInfo {
	cpu: string;
	cores: number;
	memoryGb: number;
	os: string;
	versions: [name: string, version: string][];
}
