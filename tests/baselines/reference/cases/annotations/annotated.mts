/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
declare function f(a: number, b: string, c: number | null, d: number): Promise<boolean>;
export { f };
export type { f as $py$f };
