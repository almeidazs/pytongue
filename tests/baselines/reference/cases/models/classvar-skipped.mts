/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
interface Counter {
  value: number;
}
declare namespace Counter {
  type Input = Counter;
}
export type { Counter };
export {};
export type { Counter as $py$Counter };
