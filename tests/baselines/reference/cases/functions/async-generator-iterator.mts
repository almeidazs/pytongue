/* pytongue */
/**
 * @remarks pytongue: `bytes` has no JSON form, so it is typed as `unknown`.
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
declare function stream(chunks: number): AsyncIterable<unknown>;
export { stream };
export type { stream as $py$stream };
