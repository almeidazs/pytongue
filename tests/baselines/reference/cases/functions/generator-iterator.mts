/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
declare function count(n: number): AsyncIterable<number>;
export { count };
export type { count as $py$count };
