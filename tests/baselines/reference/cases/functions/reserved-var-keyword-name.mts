/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
declare function setup($new?: { [key: string]: number | undefined; }): Promise<void>;
export { setup };
export type { setup as $py$setup };
