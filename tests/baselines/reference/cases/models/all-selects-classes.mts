/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
interface Public {
  value: number;
}
declare namespace Public {
  type Input = Public;
}
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
interface Internal {
  value: number;
}
declare namespace Internal {
  type Input = Internal;
}
declare function make(): Promise<Public>;
export type { Public };
export { make };
export type { Public as $py$Public, Internal as $py$Internal, make as $py$make };
