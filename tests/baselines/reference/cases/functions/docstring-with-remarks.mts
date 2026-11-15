/* pytongue */
/**
 * Parse a raw value.
 *
 * @remarks pytongue: parameter `raw` has no type hint, so it is typed as `unknown`.
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
declare function parse(raw: unknown): Promise<number>;
export { parse };
export type { parse as $py$parse };
