/* pytongue */
/**
 * @remarks pytongue: computed field `double` has no return type hint, so it is typed as `unknown`.
 */
interface Rect {
  width: number;
  double: unknown;
}
declare namespace Rect {
  interface Input {
    width: number;
  }
}
export type { Rect };
export {};
export type { Rect as $py$Rect };
