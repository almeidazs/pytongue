/* pytongue */
/**
 * @remarks pytongue: `__all__` is not a literal list of strings, so exports follow the public-name rule.
 */
declare function double(x: number): Promise<number>;
/**
 * @remarks pytongue: `__all__` is not a literal list of strings, so exports follow the public-name rule.
 */
declare function triple(x: number): Promise<number>;
export { double, triple };
export type { double as $py$double, triple as $py$triple };
