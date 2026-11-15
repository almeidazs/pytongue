/**
 * The interface generated `.py` modules call into.
 *
 * @module
 */
import type { Layout } from './wire';

/** A Python function as seen from JavaScript. */
export type PyFunction = (...args: unknown[]) => unknown;

/** One imported `.py` file; the generated module calls `pyModule(file, env).fn(name, layout)`. */
export interface PyModule {
	/**
	 * Creates the JavaScript function that forwards calls to a Python function.
	 *
	 * @param name - The Python function name.
	 * @param layout - How its arguments are passed.
	 * @returns A function returning a promise, or an async iterable for a generator.
	 */
	fn(name: string, layout: Layout): PyFunction;
}
