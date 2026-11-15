/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
interface Box {
  value: number;
}
declare namespace Box {
  type Input = Box;
}
/**
 * @remarks pytongue: generic `Box[...]` is not supported yet, so it is typed as `unknown`.
 * @remarks pytongue: generic `Pair[...]` is not supported yet, so it is typed as `unknown`.
 */
declare function f(a: Box.Input, b: unknown, c: unknown): Promise<void>;
export type { Box };
export { f };
type $alias$Pair = [number, number];
type $aliasInput$Pair = [number, number];
declare namespace $alias$Pair {
  type Input = $aliasInput$Pair;
}
export type { $alias$Pair as $py$Pair, Box as $py$Box, f as $py$f };
