/* pytongue */
declare function f(m: "read" | "write"): Promise<"read" | "write">;
export { f };
type $alias$Mode = "read" | "write";
type $aliasInput$Mode = "read" | "write";
declare namespace $alias$Mode {
  type Input = $aliasInput$Mode;
}
export type { $alias$Mode as $py$Mode, f as $py$f };
