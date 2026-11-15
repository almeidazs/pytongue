/* pytongue */
interface Rect {
  width: number;
  height: number;
  /** Width times height. */
  area: number;
}
declare namespace Rect {
  interface Input {
    width: number;
    height: number;
  }
}
export type { Rect };
export {};
export type { Rect as $py$Rect };
