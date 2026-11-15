/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
interface Entity {
  id: number;
  version: number;
}
declare namespace Entity {
  interface Input {
    id: number;
    version?: number;
  }
}
export type { Entity };
export {};
export type { Entity as $py$Entity };
