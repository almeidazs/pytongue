/* pytongue */
/**
 * @remarks pytongue: type variables (generics) are not supported yet, so it is typed as `unknown`.
 */
interface Box {
  item: unknown;
}
declare namespace Box {
  type Input = Box;
}
/**
 * @remarks pytongue: generic `Box[...]` is not supported yet, so it is typed as `unknown`.
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
declare function unbox(b: unknown): Promise<number>;
export type { Box };
export { unbox };
export type { Box as $py$Box, unbox as $py$unbox };
