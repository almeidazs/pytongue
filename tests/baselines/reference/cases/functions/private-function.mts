/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
declare function $public(x: number): Promise<number>;
export { $public as public };
export type { $public as $py$public };
