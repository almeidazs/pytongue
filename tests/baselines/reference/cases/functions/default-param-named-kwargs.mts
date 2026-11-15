/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
declare function run(kwargs$?: { kwargs?: number; }): Promise<void>;
export { run };
export type { run as $py$run };
