/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
declare function ok(x: number): Promise<number>;
export { ok };
export type { ok as $py$ok };
