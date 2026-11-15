/**
 * Types and small helpers shared by the report renderer and the interpretation.
 *
 * @module
 */
import type {
	Adapter,
	MachineInfo,
	Outcome,
	RuntimeId,
	ToolResults,
} from './types.ts';

/** The id the native-Python floor is stored under. */
export const NATIVE_ID = 'native';

/** A runtime column group of the report. */
export interface RuntimeReport {
	id: RuntimeId;
	label: string;
	/** Per tool id, including {@link NATIVE_ID}. */
	results: Record<string, ToolResults>;
}

/** Everything the report needs. */
export interface ReportInput {
	date: string;
	quick: boolean;
	partial: boolean;
	elapsedSeconds: number;
	machine: MachineInfo;
	adapters: Adapter[];
	runtimes: RuntimeReport[];
	timeoutSeconds: number;
}

/**
 * Formats a number compactly: more decimals for small values, thousands separators for big ones.
 *
 * @param value - The number.
 * @returns The text.
 */
export function num(value: number): string {
	if (!Number.isFinite(value)) return 'n/a';

	if (value !== 0 && Math.abs(value) < 0.01) return '<0.01';

	const digits = value >= 1000 ? 0 : value >= 100 ? 0 : value >= 10 ? 1 : 2;

	return value.toLocaleString('en-US', {
		minimumFractionDigits: digits,
		maximumFractionDigits: digits,
	});
}

/**
 * Returns the data of an outcome that succeeded.
 *
 * @param outcome - A stored outcome.
 * @returns Its data, or `undefined`.
 */
export function ok<T>(outcome: Outcome<T> | undefined): T | undefined {
	return outcome?.kind === 'ok' ? outcome.data : undefined;
}
