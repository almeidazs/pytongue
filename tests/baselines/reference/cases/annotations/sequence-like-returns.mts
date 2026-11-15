/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
declare function a(): Promise<number[]>;
declare function b(): Promise<string[]>;
declare function c(): Promise<number[]>;
declare function d(): Promise<boolean[]>;
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
declare function e(): Promise<number[]>;
declare function f(): Promise<string[]>;
export { a, b, c, d, e, f };
export type { a as $py$a, b as $py$b, c as $py$c, d as $py$d, e as $py$e, f as $py$f };
