/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
declare function ok(x: number): Promise<number>;
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
declare function clamp(x: number): Promise<number>;
export { ok, clamp };
export type { ok as $py$ok, clamp as $py$clamp };
