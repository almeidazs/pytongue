/* pytongue */
/**
 * @remarks pytongue: `bytes` has no JSON form, so it is typed as `unknown`.
 * @remarks pytongue: `bytearray` has no JSON form, so it is typed as `unknown`.
 * @remarks pytongue: `memoryview` has no JSON form, so it is typed as `unknown`.
 */
declare function f(a: unknown, b: unknown, c: unknown): Promise<void>;
export { f };
export type { f as $py$f };
