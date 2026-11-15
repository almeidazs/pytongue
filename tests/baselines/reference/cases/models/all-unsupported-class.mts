/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 * @remarks pytongue: `Row` is not a function, BaseModel, TypedDict or Enum, so it is not exported.
 */
interface Model {
  id: number;
}
declare namespace Model {
  type Input = Model;
}
export type { Model };
export {};
type $Unknown = unknown;
declare namespace $Unknown {
  type Input = unknown;
}
export type { $Unknown as $py$Row, Model as $py$Model };
