/* pytongue */
interface Item {
  parent: Item | null;
}
declare namespace Item {
  interface Input {
    parent?: Item.Input | null;
  }
}
declare function f(item: Item.Input): Promise<Item[]>;
export type { Item };
export { f };
export type { f as $py$f, Item as $py$Item };
