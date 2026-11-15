/* pytongue */
/**
 * Soma o preço × quantidade 🧮.
 *
 * Ação: multiplica — ✔️ simples.
 *
 * @remarks pytongue: parameter `qty` has no type hint, so it is typed as `unknown`.
 */
declare function total(price: number, qty: unknown): Promise<number>;
export { total };
export type { total as $py$total };
