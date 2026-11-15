/* pytongue */
/**
 * @remarks pytongue: enum member `B` has a value pytongue cannot read statically, so it is typed as `unknown`.
 */
type Dynamic = unknown;
declare namespace Dynamic {
  type Input = Dynamic;
}
declare function make(): Promise<string>;
export type { Dynamic };
export { make };
export type { make as $py$make, Dynamic as $py$Dynamic };
