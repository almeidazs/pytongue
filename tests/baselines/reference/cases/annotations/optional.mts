/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
declare function f(a: number | null, b: string | null, c: null, d: number[] | null): Promise<void>;
export { f };
export type { f as $py$f };
