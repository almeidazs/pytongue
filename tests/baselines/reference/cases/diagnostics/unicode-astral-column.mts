/* pytongue */
/**
 * @remarks pytongue: parameter `name` has no type hint, so it is typed as `unknown`.
 */
declare function greet(kwargs: { msg?: string; name: unknown; }): Promise<string>;
export { greet };
export type { greet as $py$greet };
