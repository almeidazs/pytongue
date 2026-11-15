/* pytongue */
/**
 * @remarks pytongue: type variables (generics) are not supported yet, so it is typed as `unknown`.
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
declare function g(a: unknown, b: number): Promise<number>;
export { g };
export type { g as $py$g };
