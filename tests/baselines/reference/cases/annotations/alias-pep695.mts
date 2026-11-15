/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
declare function f(p: [number, number], n: string | null): Promise<void>;
export { f };
type $alias$Pair = [number, number];
type $aliasInput$Pair = [number, number];
declare namespace $alias$Pair {
  type Input = $aliasInput$Pair;
}
type $alias$Name = string;
type $aliasInput$Name = string;
declare namespace $alias$Name {
  type Input = $aliasInput$Name;
}
type $alias$Maybe = string | null;
type $aliasInput$Maybe = string | null;
declare namespace $alias$Maybe {
  type Input = $aliasInput$Maybe;
}
export type { $alias$Pair as $py$Pair, $alias$Name as $py$Name, $alias$Maybe as $py$Maybe, f as $py$f };
