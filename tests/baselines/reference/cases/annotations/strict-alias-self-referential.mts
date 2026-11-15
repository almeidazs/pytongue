/* pytongue */
/**
 * @remarks pytongue: type alias `Nested` is recursive, so it is typed as `unknown`.
 */
declare function f(x: unknown[]): Promise<void>;
export { f };
type $alias$Nested = unknown[][];
type $aliasInput$Nested = unknown[][];
declare namespace $alias$Nested {
  type Input = $aliasInput$Nested;
}
export type { $alias$Nested as $py$Nested, f as $py$f };
