/**
 * The error payload the Python worker sends.
 *
 * @module
 */

/** A Python exception as serialized by the worker. */
export interface PythonErrorPayload {
	/** The exception class name, such as `ValueError`. */
	type: string;
	/** The module the exception class lives in. */
	module: string;
	/** `str(exception)`. */
	message: string;
	/** The formatted Python traceback. */
	traceback: string;
	/** Present for Pydantic validation errors: `ValidationError.errors()`. */
	validation?: unknown[];
}
