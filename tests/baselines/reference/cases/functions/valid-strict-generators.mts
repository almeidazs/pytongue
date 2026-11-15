/* pytongue */
declare function sync_items(): AsyncIterable<string>;
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
declare function async_items(): AsyncIterable<number>;
export { sync_items, async_items };
export type { sync_items as $py$sync_items, async_items as $py$async_items };
