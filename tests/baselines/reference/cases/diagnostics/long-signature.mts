/* pytongue */
/**
 * @remarks pytongue: parameter `application_name` has no type hint, so it is typed as `unknown`.
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
declare function configure(host: string, port: number, user: string, password: string, database: string, kwargs: { timeout?: number; retries?: number; verbose?: boolean; ssl?: boolean; pool_size?: number; application_name: unknown; }): Promise<boolean>;
export { configure };
export type { configure as $py$configure };
