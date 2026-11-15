/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
declare function total(): Promise<number>;
declare function total(values: number[]): Promise<number>;
export { total };
export type { total as $py$total };
