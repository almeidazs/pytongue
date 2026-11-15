/* pytongue */
/**
 * @remarks pytongue: class `Engine` is not a BaseModel, TypedDict or Enum, so it is typed as `unknown`.
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
interface Car {
  engine: unknown;
  wheels: number;
}
declare namespace Car {
  interface Input {
    engine: unknown;
    wheels?: number;
  }
}
export type { Car };
export {};
type $Unknown = unknown;
declare namespace $Unknown {
  type Input = unknown;
}
export type { $Unknown as $py$Engine, Car as $py$Car };
