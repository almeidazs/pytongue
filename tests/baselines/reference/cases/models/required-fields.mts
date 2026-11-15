/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
interface User {
  name: string;
  age: number;
  score: number;
  active: boolean;
}
declare namespace User {
  type Input = User;
}
export type { User };
export {};
export type { User as $py$User };
