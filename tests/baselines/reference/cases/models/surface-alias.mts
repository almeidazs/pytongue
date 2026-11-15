/* pytongue */
interface Item {
  name: string;
}
declare namespace Item {
  type Input = Item;
}
export type { Item };
export {};
type $alias$Items = Item[];
type $aliasInput$Items = Item.Input[];
declare namespace $alias$Items {
  type Input = $aliasInput$Items;
}
type $alias$MaybeItem = Item | null;
type $aliasInput$MaybeItem = Item.Input | null;
declare namespace $alias$MaybeItem {
  type Input = $aliasInput$MaybeItem;
}
export type { Item as $py$Item, $alias$Items as $py$Items, $alias$MaybeItem as $py$MaybeItem };
