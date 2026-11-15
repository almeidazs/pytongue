/* pytongue */
/**
 * @remarks pytongue: `bytes` has no JSON form, so it is typed as `unknown`.
 */
declare function f(x: unknown | null): Promise<void>;
export { f };
type $alias$Raw = unknown | null;
type $aliasInput$Raw = unknown | null;
declare namespace $alias$Raw {
  type Input = $aliasInput$Raw;
}
export type { $alias$Raw as $py$Raw, f as $py$f };
