/**
 * Settings shared by the property-based tests: a fixed seed and a modest run count for every
 * push, and random seeds with many runs for the scheduled job.
 *
 * @module
 */
import type { Parameters as FcParameters } from 'fast-check';

/** The seed used unless `PYTONGUE_FUZZ_SEED` says otherwise. */
export const DEFAULT_SEED = 20_261_115;

/** Whether this is the heavy scheduled run (`PYTONGUE_FUZZ=heavy`). */
export const HEAVY = process.env.PYTONGUE_FUZZ === 'heavy';

/** The seed of this run. A scheduled run passes a fresh one and prints it on failure. */
export const SEED = Number(process.env.PYTONGUE_FUZZ_SEED ?? DEFAULT_SEED);

/**
 * Chooses how many cases a property runs.
 *
 * @param light - Cases on every push.
 * @param heavy - Cases in the scheduled run.
 * @returns The number of runs.
 */
export function runs(light: number, heavy: number): number {
	return HEAVY ? heavy : light;
}

/**
 * Builds fast-check parameters for a property.
 *
 * @param light - Cases on every push.
 * @param heavy - Cases in the scheduled run.
 * @template T - The property's input tuple, inferred at the call site.
 * @returns Parameters with this run's seed.
 */
export function fuzz<T>(light: number, heavy: number): FcParameters<T> {
	return { seed: SEED, numRuns: runs(light, heavy), verbose: 1 };
}
