/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
declare function f(a: string, b: string, c: string, d: string, e: number): Promise<void>;
export { f };
export type { f as $py$f };
