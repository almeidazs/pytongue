/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
declare function fib(n: number): Promise<number>;
export { fib };
export type { fib as $py$fib };
