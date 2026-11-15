/**
 * The errors calls into Python reject with.
 *
 * @module
 */
import type { PythonErrorPayload } from '@/types/runtime';

/** A Python exception raised by the called function, or by importing its module. */
export class PythonError extends Error {
	override name = 'PythonError';
	/** The exception class, such as `ValueError`. */
	readonly pyType: string;
	/** The module the exception class lives in. */
	readonly pyModule: string;
	/** The formatted Python traceback. */
	readonly traceback: string;

	/**
	 * Creates the error from the worker's payload.
	 *
	 * @param payload - The serialized exception.
	 */
	constructor(payload: PythonErrorPayload) {
		super(`${payload.type}: ${payload.message}`);
		this.pyType = payload.type;
		this.pyModule = payload.module;
		this.traceback = payload.traceback;
	}
}

/** Pydantic rejected the arguments. */
export class PythonValidationError extends PythonError {
	override name = 'PythonValidationError';
	/** Pydantic's `ValidationError.errors()`. */
	readonly errors: unknown[];

	/**
	 * Creates the error from the worker's payload.
	 *
	 * @param payload - The serialized `ValidationError`.
	 */
	constructor(payload: PythonErrorPayload) {
		super(payload);
		this.errors = payload.validation ?? [];
	}
}

/** The worker process failed: uv missing, crashed, killed, or exited mid-call. Calls are never resent. */
export class PythonWorkerError extends Error {
	override name = 'PythonWorkerError';

	/**
	 * Creates the error.
	 *
	 * @param message - What happened.
	 * @param exitCode - The worker's exit code, if it exited.
	 * @param signal - The signal that killed it, if any (a plain string, so the public `.d.ts`
	 *   does not require `@types/node`).
	 * @param stderr - The end of the worker's stderr.
	 */
	constructor(
		message: string,
		readonly exitCode: number | null = null,
		readonly signal: string | null = null,
		readonly stderr = '',
	) {
		super(message);
	}
}

/**
 * Builds the right error class for a payload.
 *
 * @param payload - The serialized exception.
 * @returns A {@link PythonValidationError} for Pydantic errors, a {@link PythonError} otherwise.
 */
export function toPythonError(payload: PythonErrorPayload): PythonError {
	return payload.validation
		? new PythonValidationError(payload)
		: new PythonError(payload);
}
