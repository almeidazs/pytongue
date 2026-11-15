/* pytongue */
import type { $py$Base as Base } from "./base.py";
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
interface Child extends Base {
  extra: number;
}
declare namespace Child {
  interface Input extends Base.Input {
    extra?: number;
  }
}
export type { Child };
export {};
export type { Base as $py$Base, Child as $py$Child };
