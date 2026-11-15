/* pytongue */
/**
 * @remarks pytongue: `Callable` cannot cross the process boundary, so it is typed as `unknown`.
 * @remarks pytongue: `type` cannot cross the process boundary, so it is typed as `unknown`.
 * @remarks pytongue: `Type` cannot cross the process boundary, so it is typed as `unknown`.
 * @remarks pytongue: `typing.Callable` is not supported, so it is typed as `unknown`.
 */
declare function f(a: unknown, b: unknown, c: unknown, d: unknown): Promise<void>;
export { f };
export type { f as $py$f };
