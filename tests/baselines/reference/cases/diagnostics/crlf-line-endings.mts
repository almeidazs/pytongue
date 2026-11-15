/* pytongue */
/**
 * @remarks pytongue: parameter `height` has no type hint, so it is typed as `unknown`.
 */
declare function area(width: number, height: unknown): Promise<number>;
declare function ok(x: string): Promise<string>;
export { area, ok };
export type { area as $py$area, ok as $py$ok };
