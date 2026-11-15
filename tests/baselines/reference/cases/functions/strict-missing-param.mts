/* pytongue */
/**
 * @remarks pytongue: parameter `a` has no type hint, so it is typed as `unknown`.
 * @remarks pytongue: parameter `c` has no type hint, so it is typed as `unknown`.
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
declare function pair(a: unknown, b: number, kwargs?: { c?: unknown; }): Promise<number>;
export { pair };
export type { pair as $py$pair };
