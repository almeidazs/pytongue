/* pytongue */
import type * as models from "../models.py";
interface Holder {
  token: models.$py$Token;
}
declare namespace Holder {
  interface Input {
    token: models.$py$Token.Input;
  }
}
export type { Holder };
export {};
export type { models as $py$models, Holder as $py$Holder };
