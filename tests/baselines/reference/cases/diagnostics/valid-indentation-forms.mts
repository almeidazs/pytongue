/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
declare function one(x: number): Promise<number>;
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
declare function semi(x: number): Promise<number>;
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
declare function decorated(a: number, b: number): Promise<number>;
export { one, semi, decorated };
type $Unknown = unknown;
declare namespace $Unknown {
  type Input = unknown;
}
export type { one as $py$one, semi as $py$semi, decorated as $py$decorated, $Unknown as $py$C };
