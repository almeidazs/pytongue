/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
declare function f(a: string, b: number, c: number | null, d: boolean[], e: Record<string, unknown>, f: [number, string], g: "x" | "y" | null): Promise<string[]>;
export { f };
export type { f as $py$f };
