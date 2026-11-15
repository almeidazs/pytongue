/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
interface Options {
  verbose?: boolean;
  depth?: number;
}
declare namespace Options {
  type Input = Options;
}
export type { Options };
export {};
export type { Options as $py$Options };
