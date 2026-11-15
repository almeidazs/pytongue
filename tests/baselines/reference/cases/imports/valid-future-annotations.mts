/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
declare function scale(value: number, factor: number): Promise<number>;
export { scale };
export type { scale as $py$scale };
