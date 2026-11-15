/* pytongue */
interface Draft {
  title: string;
  subtitle?: string;
}
declare namespace Draft {
  type Input = Draft;
}
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
interface Patch {
  id: number;
  title?: string;
}
declare namespace Patch {
  type Input = Patch;
}
export type { Draft, Patch };
export {};
export type { Draft as $py$Draft, Patch as $py$Patch };
