/* pytongue */
import type { $py$Token as Token } from "../models.py";
interface Wrapper {
  token: Token;
}
declare namespace Wrapper {
  interface Input {
    token: Token.Input;
  }
}
export type { Wrapper };
export {};
export type { Token as $py$Token, Wrapper as $py$Wrapper };
