/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
declare function paginate(kwargs?: { page?: number; size?: number; }): Promise<number[]>;
export { paginate };
export type { paginate as $py$paginate };
