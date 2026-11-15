/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
declare function f(u: number, t: string): Promise<number>;
export { f };
type $alias$UserId = number;
type $aliasInput$UserId = number;
declare namespace $alias$UserId {
  type Input = $aliasInput$UserId;
}
type $alias$Token = string;
type $aliasInput$Token = string;
declare namespace $alias$Token {
  type Input = $aliasInput$Token;
}
export type { $alias$UserId as $py$UserId, $alias$Token as $py$Token, f as $py$f };
