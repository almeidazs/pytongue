/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
declare function send(message: string, retries: number | undefined, kwargs: { channel: string; }): Promise<boolean>;
export { send };
export type { send as $py$send };
