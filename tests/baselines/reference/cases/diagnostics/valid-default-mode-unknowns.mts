/* pytongue */
/**
 * @remarks pytongue: parameter `x` has no type hint, so it is typed as `unknown`.
 * @remarks pytongue: `bytes` has no JSON form, so it is typed as `unknown`.
 * @remarks pytongue: `numpy.ndarray` comes from the module `numpy`, so it is typed as `unknown`.
 * @remarks pytongue: cannot resolve `Ghost`, so it is typed as `unknown`.
 * @remarks pytongue: no return type hint, so it is typed as `unknown`.
 */
declare function f(x: unknown, data: unknown, arr: unknown, other: unknown): Promise<unknown>;
export { f };
export type { f as $py$f };
