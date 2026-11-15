/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
interface Page {
  size: number;
  /** Page title */
  title: string;
}
declare namespace Page {
  interface Input {
    size?: number;
    /** Page title */
    title?: string;
  }
}
export type { Page };
export {};
export type { Page as $py$Page };
