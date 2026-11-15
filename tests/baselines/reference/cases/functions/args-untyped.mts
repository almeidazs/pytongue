/* pytongue */
/**
 * @remarks pytongue: parameter `items` has no type hint, so it is typed as `unknown`.
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
declare function collect(): Promise<number>;
declare function collect(items: unknown[]): Promise<number>;
export { collect };
export type { collect as $py$collect };
