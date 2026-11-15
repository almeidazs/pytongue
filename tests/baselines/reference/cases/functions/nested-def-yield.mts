/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
declare function outer(): Promise<number>;
export { outer };
export type { outer as $py$outer };
