/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
declare function f(a: (number | string)[], b: (number | null)[], c: ("a" | "b")[], d: "a"[], e: (number | null)[][]): Promise<void>;
export { f };
export type { f as $py$f };
