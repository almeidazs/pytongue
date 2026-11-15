/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
declare function f(a: "r" | "w", b: number[], c: number, d: [string, string], e: "r" | "w" | null): Promise<void>;
export { f };
type $alias$Mode = "r" | "w";
type $aliasInput$Mode = "r" | "w";
declare namespace $alias$Mode {
  type Input = $aliasInput$Mode;
}
type $alias$Ids = number[];
type $aliasInput$Ids = number[];
declare namespace $alias$Ids {
  type Input = $aliasInput$Ids;
}
type $alias$UserId = number;
type $aliasInput$UserId = number;
declare namespace $alias$UserId {
  type Input = $aliasInput$UserId;
}
type $alias$Pair = [string, string];
type $aliasInput$Pair = [string, string];
declare namespace $alias$Pair {
  type Input = $aliasInput$Pair;
}
type $alias$MaybeMode = "r" | "w" | null;
type $aliasInput$MaybeMode = "r" | "w" | null;
declare namespace $alias$MaybeMode {
  type Input = $aliasInput$MaybeMode;
}
export type { $alias$Mode as $py$Mode, $alias$Ids as $py$Ids, $alias$UserId as $py$UserId, $alias$Pair as $py$Pair, $alias$MaybeMode as $py$MaybeMode, f as $py$f };
