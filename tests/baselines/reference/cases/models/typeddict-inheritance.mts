/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
interface Base {
  id: number;
}
declare namespace Base {
  type Input = Base;
}
interface Extra extends Base {
  label?: string;
}
declare namespace Extra {
  interface Input extends Base.Input {
    label?: string;
  }
}
export type { Base, Extra };
export {};
export type { Base as $py$Base, Extra as $py$Extra };
