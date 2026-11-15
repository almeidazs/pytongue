/* pytongue */
/**
 * @remarks pytongue: type alias `Json` is recursive, so it is typed as `unknown`.
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
declare function f(a: Record<string, unknown> | unknown[] | string | number | null): Promise<void>;
export { f };
type $alias$Json = Record<string, Record<string, unknown> | unknown[] | string | number | null> | (Record<string, unknown> | unknown[] | string | number | null)[] | string | number | null;
type $aliasInput$Json = Record<string, Record<string, unknown> | unknown[] | string | number | null> | (Record<string, unknown> | unknown[] | string | number | null)[] | string | number | null;
declare namespace $alias$Json {
  type Input = $aliasInput$Json;
}
export type { $alias$Json as $py$Json, f as $py$f };
