/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
interface sub {
  from_init: number;
}
declare namespace sub {
  type Input = sub;
}
export type { sub };
export {};
export type { sub as $py$sub };
