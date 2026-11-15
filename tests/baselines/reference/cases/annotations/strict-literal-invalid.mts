/* pytongue */
/**
 * @remarks pytongue: unsupported Literal value `str`, so it is typed as `unknown`.
 * @remarks pytongue: unsupported Literal value `f"x"`, so it is typed as `unknown`.
 * @remarks pytongue: unsupported Literal value `b"x"`, so it is typed as `unknown`.
 * @remarks pytongue: unsupported Literal value `1 + 2`, so it is typed as `unknown`.
 */
declare function f(a: unknown, b: unknown, c: unknown, d: unknown): Promise<void>;
export { f };
export type { f as $py$f };
