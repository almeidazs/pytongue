/* pytongue */
interface Token {
  text: string;
}
declare namespace Token {
  type Input = Token;
}
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
interface Span {
  start: number;
  end: number;
}
declare namespace Span {
  type Input = Span;
}
export type { Token, Span };
export {};
export type { Token as $py$Token, Span as $py$Span };
