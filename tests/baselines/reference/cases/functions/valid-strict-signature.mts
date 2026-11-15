/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
declare function full(a: number, b: string | undefined, c: number | undefined, rest: { d: boolean; [key: string]: string | boolean | undefined; }): Promise<void>;
declare function full(a: number, b: string, c: number, args: number[], rest: { d: boolean; [key: string]: string | boolean | undefined; }): Promise<void>;
export { full };
export type { full as $py$full };
