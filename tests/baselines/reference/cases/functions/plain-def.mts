/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
declare function add(a: number, b: number): Promise<number>;
export { add };
export type { add as $py$add };
