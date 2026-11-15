/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
declare function f(b: number, c: number, d: number[]): Promise<number>;
export { f };
export type { f as $py$f };
