/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
interface Row {
  id: number;
}
declare namespace Row {
  type Input = Row;
}
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
declare function f(a: number, b: Row.Input, c: string): Promise<number>;
export type { Row };
export { f };
type $alias$MyInt = number;
type $aliasInput$MyInt = number;
declare namespace $alias$MyInt {
  type Input = $aliasInput$MyInt;
}
type $alias$RowAlias = Row;
type $aliasInput$RowAlias = Row.Input;
declare namespace $alias$RowAlias {
  type Input = $aliasInput$RowAlias;
}
type $alias$When = string;
type $aliasInput$When = string;
declare namespace $alias$When {
  type Input = $aliasInput$When;
}
export type { Row as $py$Row, $alias$MyInt as $py$MyInt, $alias$RowAlias as $py$RowAlias, $alias$When as $py$When, f as $py$f };
