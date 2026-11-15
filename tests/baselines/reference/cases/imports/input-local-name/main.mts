/* pytongue */
import type { $py$Token as Input } from "./models.py";
interface Wrapper {
  token: Input;
}
interface $Input$Wrapper {
  token: Input.Input;
}
declare namespace Wrapper {
  type Input = $Input$Wrapper;
}
export type { Wrapper };
export {};
export type { Input as $py$Input, Wrapper as $py$Wrapper };
