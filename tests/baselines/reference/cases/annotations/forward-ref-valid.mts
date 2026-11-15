/* pytongue */
interface Item {
  name: string;
}
declare namespace Item {
  type Input = Item;
}
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
declare function f(a: number, b: string[], c: number | null, d: Item.Input, e: Record<string, number>): Promise<Item>;
export type { Item };
export { f };
export type { f as $py$f, Item as $py$Item };
