/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
declare function limits(more?: { low?: number; high?: number; [key: string]: number | undefined; }): Promise<void>;
export { limits };
export type { limits as $py$limits };
