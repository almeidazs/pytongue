/**
 * Paths, the child-to-driver protocol, statistics and the payload generator.
 *
 * @module
 */
import { join } from 'node:path';

import type { Payload } from './types.ts';

/** The `benchmark/` directory. */
export const BENCH_DIR = import.meta.dirname;

/** The repository root, which holds the pytongue package. */
export const REPO_ROOT = join(BENCH_DIR, '..');

/** The directory with the Python files. */
export const PY_DIR = join(BENCH_DIR, 'python');

/** The Python module every tool calls. */
export const BENCH_PY = join(PY_DIR, 'bench.py');

/** Prefix of the lines a child prints for the driver. */
export const MARK = '@@RESULT@@ ';

/** The interpreter of the prepared virtual environment (3.12, with `javascript` for pythonia). */
export const PYTHON =
	process.env.PYTONGUE_BENCH_PYTHON ??
	join(BENCH_DIR, '.venv', 'bin', 'python');

/** The uv binary. */
export const UV = process.env.PYTONGUE_UV ?? 'uv';

/**
 * Writes one protocol line to stdout and waits until it is flushed.
 *
 * @param message - The JSON-serializable message.
 * @returns Resolves once the line was written.
 */
export function emit(message: unknown): Promise<void> {
	return new Promise((resolve) => {
		process.stdout.write(`${MARK}${JSON.stringify(message)}\n`, () =>
			resolve(),
		);
	});
}

/**
 * Returns the nearest-rank percentile of an ascending list.
 *
 * @param sorted - The values, ascending.
 * @param p - The percentile, from 0 to 100.
 * @returns The value at that percentile.
 */
export function percentile(sorted: number[], p: number): number {
	const rank = Math.ceil((p / 100) * sorted.length) - 1;

	return sorted[Math.min(sorted.length - 1, Math.max(0, rank))] ?? Number.NaN;
}

/**
 * Returns the median of a list.
 *
 * @param values - The values, in any order.
 * @returns The middle value (the mean of the two middle ones for an even count).
 */
export function median(values: number[]): number {
	const sorted = values.toSorted((a, b) => a - b);
	const mid = Math.floor(sorted.length / 2);

	return sorted.length % 2
		? (sorted[mid] ?? Number.NaN)
		: ((sorted[mid - 1] ?? Number.NaN) + (sorted[mid] ?? Number.NaN)) / 2;
}

/**
 * Returns the arithmetic mean of a list.
 *
 * @param values - The values.
 * @returns Their mean.
 */
export function mean(values: number[]): number {
	return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/**
 * Builds an object with a list of records whose JSON is about `targetBytes` long.
 *
 * @param targetBytes - The approximate JSON size.
 * @returns A deterministic payload.
 */
export function makePayload(targetBytes: number): Payload {
	const records: Payload['records'] = [];
	let size = 14;

	while (size < targetBytes) {
		const i = records.length;
		const record = {
			id: i,
			name: `record-${i}`,
			price: i * 1.25,
			active: i % 2 === 0,
			tags: ['alpha', 'beta', 'gamma'],
		};

		records.push(record);
		size += JSON.stringify(record).length + 1;
	}

	return { records };
}
