/* pytongue */
declare function f(m: "r" | "w" | "a"): Promise<void>;
export { f };
type $alias$Mode = "r" | "w";
type $aliasInput$Mode = "r" | "w";
declare namespace $alias$Mode {
  type Input = $aliasInput$Mode;
}
export type { $alias$Mode as $py$Mode, f as $py$f };
