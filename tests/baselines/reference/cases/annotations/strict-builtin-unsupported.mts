/* pytongue */
/**
 * @remarks pytongue: `builtins.complex` is not supported, so it is typed as `unknown`.
 * @remarks pytongue: `builtins.type` is not supported, so it is typed as `unknown`.
 */
declare function f(c: unknown, t: unknown): Promise<void>;
export { f };
export type { f as $py$f };
