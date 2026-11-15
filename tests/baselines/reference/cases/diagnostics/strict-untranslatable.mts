/* pytongue */
/**
 * @remarks pytongue: `bytes` has no JSON form, so it is typed as `unknown`.
 * @remarks pytongue: `Callable` cannot cross the process boundary, so it is typed as `unknown`.
 */
declare function run(data: unknown, callback: unknown): Promise<string>;
export { run };
export type { run as $py$run };
