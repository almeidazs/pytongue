/* pytongue */
import type { $py$Point as Point } from "./shapes.py";
interface Opt extends Point {
  z?: number;
}
declare namespace Opt {
  interface Input extends Point.Input {
    z?: number;
  }
}
interface Nr extends Point {
  w?: number;
}
declare namespace Nr {
  interface Input extends Point.Input {
    w?: number;
  }
}
export type { Opt, Nr };
export {};
export type { Point as $py$Point, Opt as $py$Opt, Nr as $py$Nr };
