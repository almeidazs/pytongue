/* pytongue */
/**
 * An RGB color.
 *
 * Channels go from 0 to 255.
 *
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
interface Color {
  r: number;
  g: number;
  b: number;
}
declare namespace Color {
  type Input = Color;
}
export type { Color };
export {};
export type { Color as $py$Color };
