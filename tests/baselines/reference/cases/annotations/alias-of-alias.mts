/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
declare function f(a: number[] | null): Promise<void>;
export { f };
type $alias$Ints = number[];
type $aliasInput$Ints = number[];
declare namespace $alias$Ints {
  type Input = $aliasInput$Ints;
}
type $alias$MaybeInts = number[] | null;
type $aliasInput$MaybeInts = number[] | null;
declare namespace $alias$MaybeInts {
  type Input = $aliasInput$MaybeInts;
}
type $alias$Final_ = number[] | null;
type $aliasInput$Final_ = number[] | null;
declare namespace $alias$Final_ {
  type Input = $aliasInput$Final_;
}
export type { $alias$Ints as $py$Ints, $alias$MaybeInts as $py$MaybeInts, $alias$Final_ as $py$Final_, f as $py$f };
