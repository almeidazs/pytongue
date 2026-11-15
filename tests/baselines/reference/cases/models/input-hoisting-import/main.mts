/* pytongue */
import type { $py$Input as Input } from "./forms.py";
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
interface Wrapper {
  payload: Input;
  retries: number;
}
interface $Input$Wrapper {
  payload: Input.Input;
  retries?: number;
}
declare namespace Wrapper {
  type Input = $Input$Wrapper;
}
export type { Wrapper };
export {};
export type { Input as $py$Input, Wrapper as $py$Wrapper };
