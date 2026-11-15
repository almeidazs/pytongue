/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
interface Base {
  id: number;
}
declare namespace Base {
  interface Input {
    id?: number;
  }
}
export type { Base };
export {};
export type { Base as $py$Base };
