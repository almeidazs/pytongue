/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
interface Thing {
  n: number;
}
declare namespace Thing {
  type Input = Thing;
}
export type { Thing };
export {};
export type { Thing as $py$Thing };
