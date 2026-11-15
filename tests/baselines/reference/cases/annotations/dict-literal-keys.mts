/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
declare function f(a: Partial<Record<"a" | "b", number>>, b: Partial<Record<"red" | "green", number>>, c: Partial<Record<"only", string>>): Promise<void>;
export { f };
type $alias$Color = "red" | "green";
type $aliasInput$Color = "red" | "green";
declare namespace $alias$Color {
  type Input = $aliasInput$Color;
}
export type { $alias$Color as $py$Color, f as $py$f };
