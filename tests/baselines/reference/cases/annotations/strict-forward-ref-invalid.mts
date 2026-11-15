/* pytongue */
/**
 * @remarks pytongue: cannot parse string annotation `"list["`, so it is typed as `unknown`.
 * @remarks pytongue: unsupported string annotation `f"int"`, so it is typed as `unknown`.
 * @remarks pytongue: unsupported string annotation `b"int"`, so it is typed as `unknown`.
 * @remarks pytongue: unsupported string annotation `"in\x74"`, so it is typed as `unknown`.
 * @remarks pytongue: unsupported string annotation `"Opt" "ional[int]"`, so it is typed as `unknown`.
 */
declare function f(a: unknown, b: unknown, c: unknown, d: unknown, e: unknown): Promise<void>;
export { f };
export type { f as $py$f };
