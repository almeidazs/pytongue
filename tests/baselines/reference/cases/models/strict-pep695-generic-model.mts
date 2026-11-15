/* pytongue */
/**
 * @remarks pytongue: type variables (generics) are not supported yet, so it is typed as `unknown`.
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
interface Box {
  item: unknown;
  count: number;
}
declare namespace Box {
  type Input = Box;
}
export type { Box };
export {};
export type { Box as $py$Box };
