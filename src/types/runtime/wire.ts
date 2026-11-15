/**
 * How JavaScript arguments are mapped onto a Python call.
 *
 * @module
 */

/**
 * How JS arguments map onto a Python signature: required parameters are positional, parameters
 * with a default go into a trailing keyword-arguments object. Produced by the loader.
 */
export interface Layout {
	/** The number of required positional parameters. */
	req: number;
	/** Names of positional-only parameters with a default (optional positionals). */
	opt: string[];
	/** Has `*args`: an array in the slot after the positionals. */
	rest: boolean;
	/** Has a trailing keyword-arguments object. */
	kw: boolean;
	/** Is a generator: the call returns an async iterable. */
	gen: boolean;
	/** Returns `None`: resolve with `undefined`. */
	void: boolean;
	/** Unknown signature (a name re-exported from a package): every argument is positional. */
	generic?: boolean;
}

/** A call as sent to the worker. */
export interface Wire {
	/** Positional arguments. */
	args: unknown[];
	/** The `*args` array, or `null`. */
	rest: unknown[] | null;
	/** Keyword arguments; `undefined` values are dropped by JSON. */
	kwargs: Record<string, unknown>;
}

/** The layout of a function whose signature is unknown. */
export const GENERIC_LAYOUT: Readonly<Layout> = {
	req: 0,
	opt: [],
	rest: false,
	kw: false,
	gen: false,
	void: false,
	generic: true,
};
