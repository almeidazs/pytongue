/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
declare function f(i: number | string, n: string | null): Promise<void>;
export { f };
type $alias$Id = number | string;
type $aliasInput$Id = number | string;
declare namespace $alias$Id {
  type Input = $aliasInput$Id;
}
type $alias$MaybeName = string | null;
type $aliasInput$MaybeName = string | null;
declare namespace $alias$MaybeName {
  type Input = $aliasInput$MaybeName;
}
export type { $alias$Id as $py$Id, $alias$MaybeName as $py$MaybeName, f as $py$f };
