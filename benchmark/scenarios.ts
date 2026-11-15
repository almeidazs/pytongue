/* oxlint-disable no-await-in-loop -- the benchmark measures calls made one after another */
/**
 * The measured scenarios, written once against the {@link Session} interface.
 *
 * @module
 */
import { makePayload, mean, median, percentile } from './shared.ts';
import type {
	Adapter,
	CpuResult,
	LatencyResult,
	PayloadResult,
	Rate,
	Session,
	ThroughputResult,
} from './types.ts';

/**
 * Calls `add(1, 2)` and waits for it only when it returned a promise.
 *
 * @param session - The open session.
 */
async function addOnce(session: Session): Promise<void> {
	const result = session.add(1, 2);

	if (result instanceof Promise) await result;
}

/**
 * Times sequential `add(1, 2)` calls after a warm-up.
 *
 * @param adapter - The tool, for its iteration caps.
 * @param session - The open session.
 * @param quick - Whether to use the reduced iteration counts.
 * @returns Percentiles and mean in microseconds.
 */
export async function latency(
	adapter: Adapter,
	session: Session,
	quick: boolean,
): Promise<LatencyResult> {
	const n = Math.min(
		quick ? 200 : 2000,
		adapter.limits?.latencyCalls ?? Infinity,
	);
	const warmup = Math.min(
		quick ? 20 : 200,
		adapter.limits?.warmupCalls ?? Infinity,
	);

	for (let i = 0; i < warmup; i++) await addOnce(session);

	const samples: number[] = [];

	for (let i = 0; i < n; i++) {
		const start = performance.now();

		await addOnce(session);
		samples.push((performance.now() - start) * 1000);
	}

	const sorted = samples.toSorted((a, b) => a - b);

	return {
		n,
		warmup,
		p50: percentile(sorted, 50),
		p95: percentile(sorted, 95),
		p99: percentile(sorted, 99),
		mean: mean(samples),
	};
}

/**
 * Measures calls per second, sequentially and with up to 100 calls in flight.
 *
 * @param adapter - The tool, for its iteration caps and whether it is synchronous.
 * @param session - The open session.
 * @param quick - Whether to use the reduced iteration counts.
 * @returns The two rates (the concurrent one is `null` for synchronous tools).
 */
export async function throughput(
	adapter: Adapter,
	session: Session,
	quick: boolean,
): Promise<ThroughputResult> {
	const n = Math.min(
		quick ? 2000 : 20_000,
		adapter.limits?.throughputCalls ?? Infinity,
	);
	const inflight = 100;

	for (let i = 0; i < Math.min(200, n); i++) await addOnce(session);

	const sequential = await rate(n, 1, () => addOnce(session));
	const concurrent = adapter.synchronous
		? null
		: await rate(n, inflight, () => addOnce(session));

	return { sequential, concurrent };
}

/**
 * Runs `n` calls with at most `inflight` outstanding and returns the rate.
 *
 * @param n - The number of calls.
 * @param inflight - The concurrency.
 * @param call - Makes one call.
 * @returns Calls per second.
 */
async function rate(
	n: number,
	inflight: number,
	call: () => Promise<void>,
): Promise<Rate> {
	let issued = 0;
	const start = performance.now();

	const lane = async (): Promise<void> => {
		while (issued < n) {
			issued++;
			await call();
		}
	};

	await Promise.all(Array.from({ length: inflight }, lane));

	return { n, inflight, opsPerSec: n / ((performance.now() - start) / 1000) };
}

/**
 * Echoes objects of about 1 KB, 100 KB and 1 MB and reports the median latency of each.
 *
 * @param adapter - The tool, for its iteration caps.
 * @param session - The open session.
 * @param quick - Whether to use the reduced iteration counts.
 * @returns One entry per size.
 */
export async function payload(
	adapter: Adapter,
	session: Session,
	quick: boolean,
): Promise<PayloadResult> {
	const plan = [
		{ label: '1 KB', target: 1000, n: 50 },
		{ label: '100 KB', target: 100_000, n: 50 },
		{ label: '1 MB', target: 1_000_000, n: 10 },
	];
	const sizes: PayloadResult['sizes'] = [];

	for (const { label, target, n } of plan) {
		const body = makePayload(target);
		const cap =
			target === 1_000_000
				? adapter.limits?.largePayloadCalls
				: undefined;
		const count = Math.min(
			quick ? Math.max(3, Math.ceil(n / 5)) : n,
			cap ?? Infinity,
		);
		const times: number[] = [];

		if (cap === undefined) await session.echo(body); // warm-up, not timed

		for (let i = 0; i < count; i++) {
			const start = performance.now();

			await session.echo(body);
			times.push(performance.now() - start);
		}

		sizes.push({
			label,
			bytes: JSON.stringify(body).length,
			n: count,
			medianMs: median(times),
		});
	}

	return { sizes };
}

/**
 * Calls the pure-Python `cpu` function five times.
 *
 * @param session - The open session.
 * @param quick - Whether to use the smaller loop.
 * @returns The median and best call time in milliseconds.
 */
export async function cpu(
	session: Session,
	quick: boolean,
): Promise<CpuResult> {
	const n = quick ? 1_000_000 : 5_000_000;
	const times: number[] = [];

	for (let i = 0; i < 5; i++) {
		const start = performance.now();

		await session.cpu(n);
		times.push(performance.now() - start);
	}

	return {
		n,
		calls: 5,
		medianMs: median(times),
		minMs: Math.min(...times),
	};
}
