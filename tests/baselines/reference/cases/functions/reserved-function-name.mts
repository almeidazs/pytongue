/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
declare function $delete(item_id: number): Promise<void>;
declare function $default(): Promise<string>;
export { $delete as delete, $default as default };
export type { $delete as $py$delete, $default as $py$default };
