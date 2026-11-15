/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
declare function f(a: number[], b: string, c: Record<string, number>): Promise<void>;
export { f };
type $alias$Ids = number[];
type $aliasInput$Ids = number[];
declare namespace $alias$Ids {
  type Input = $aliasInput$Ids;
}
type $alias$Name = string;
type $aliasInput$Name = string;
declare namespace $alias$Name {
  type Input = $aliasInput$Name;
}
type $alias$Ref = Record<string, number>;
type $aliasInput$Ref = Record<string, number>;
declare namespace $alias$Ref {
  type Input = $aliasInput$Ref;
}
export type { $alias$Ids as $py$Ids, $alias$Name as $py$Name, $alias$Ref as $py$Ref, f as $py$f };
