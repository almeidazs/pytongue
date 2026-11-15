/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
declare function search(query: string, kwargs?: { limit?: number | null; }): Promise<string[]>;
export { search };
export type { search as $py$search };
