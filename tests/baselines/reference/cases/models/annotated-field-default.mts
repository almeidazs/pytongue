/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
interface M {
  a: number[];
  b: number;
  c: number;
  /** no default */
  d: number;
}
declare namespace M {
  interface Input {
    a?: number[];
    b?: number;
    c: number;
    /** no default */
    d: number;
  }
}
export type { M };
export {};
export type { M as $py$M };
