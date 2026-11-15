/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
declare function f(a: number, b: string | undefined, kw: { c?: number; d: boolean; [key: string]: number | boolean | undefined; }): Promise<void>;
export { f };
export type { f as $py$f };
