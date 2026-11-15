/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
declare function helper(x: number): Promise<number>;
export { helper };
export type { helper as $py$helper };
