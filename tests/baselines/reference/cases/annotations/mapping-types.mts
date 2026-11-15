/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
declare function f(a: Record<string, number>, b: Record<string, number>, c: Record<string, unknown>): Promise<Record<string, string>>;
export { f };
export type { f as $py$f };
