/* pytongue */
/**
 * @remarks pytongue: parameter `x` has no type hint, so it is typed as `unknown`.
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
declare function f(x: unknown, y: number): Promise<number>;
/**
 * @remarks pytongue: cannot resolve `numpy.ndarray`, so it is typed as `unknown`.
 */
declare function g(z: unknown): Promise<string>;
export { f, g };
export type { f as $py$f, g as $py$g };
