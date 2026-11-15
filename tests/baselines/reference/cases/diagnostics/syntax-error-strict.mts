/* pytongue */
/**
 * @remarks pytongue: parameter `x` has no type hint, so it is typed as `unknown`.
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
declare function f(x: unknown): Promise<number>;
export { f };
export type { f as $py$f };
