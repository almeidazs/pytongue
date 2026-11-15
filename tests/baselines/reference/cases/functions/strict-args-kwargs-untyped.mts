/* pytongue */
/**
 * @remarks pytongue: parameter `args` has no type hint, so it is typed as `unknown`.
 * @remarks pytongue: parameter `kwargs` has no type hint, so it is typed as `unknown`.
 */
declare function forward(kwargs?: { [key: string]: unknown | undefined; }): Promise<void>;
declare function forward(args: unknown[], kwargs?: { [key: string]: unknown | undefined; }): Promise<void>;
export { forward };
export type { forward as $py$forward };
