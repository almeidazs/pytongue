/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
declare function store(key: string, value: string[], kwargs?: { ttl?: number | null; }): Promise<void>;
export { store };
export type { store as $py$store };
