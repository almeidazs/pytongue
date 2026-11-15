/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
interface Model {
  x: number;
}
declare namespace Model {
  type Input = Model;
}
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
declare function helper(): Promise<number>;
/**
 * @remarks pytongue: `helper` is not a type, so it is typed as `unknown`.
 * @remarks pytongue: `LIMIT` is not a type, so it is typed as `unknown`.
 * @remarks pytongue: class `Plain` is not a BaseModel, TypedDict or Enum, so it is typed as `unknown`.
 * @remarks pytongue: `Model.x` is not a type, so it is typed as `unknown`.
 */
declare function f(a: unknown, b: unknown, c: unknown, d: unknown): Promise<void>;
export type { Model };
export { helper, f };
type $Unknown = unknown;
declare namespace $Unknown {
  type Input = unknown;
}
export type { helper as $py$helper, $Unknown as $py$Plain, Model as $py$Model, f as $py$f };
