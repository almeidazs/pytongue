/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
declare function connect(host: string, kwargs: { port: number; }): Promise<void>;
export { connect };
export type { connect as $py$connect };
