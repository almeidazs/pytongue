/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
declare function wrap(kwargs: Record<string, number>, kwargs$?: { depth?: number; }): Promise<void>;
export { wrap };
export type { wrap as $py$wrap };
