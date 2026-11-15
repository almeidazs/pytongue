/* pytongue */
/**
 * @remarks pytongue: parameter `a` has no type hint, so it is typed as `unknown`.
 * @remarks pytongue: parameter `args` has no type hint, so it is typed as `unknown`.
 * @remarks pytongue: parameter `kwargs` has no type hint, so it is typed as `unknown`.
 * @remarks pytongue: no return type hint, so it is typed as `unknown`.
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
declare function f(a: unknown, b?: number, kwargs?: { [key: string]: unknown | undefined; }): Promise<unknown>;
declare function f(a: unknown, b: number, args: unknown[], kwargs?: { [key: string]: unknown | undefined; }): Promise<unknown>;
export { f };
export type { f as $py$f };
