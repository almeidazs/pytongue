/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
declare function f(a: number[], b: Record<string, number>, c: string[], d: number[], e: boolean[], f: number[], g: Record<string, string>): Promise<void>;
export { f };
export type { f as $py$f };
