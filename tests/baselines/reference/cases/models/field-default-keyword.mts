/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
interface Settings {
  retries: number;
  host: string;
}
declare namespace Settings {
  interface Input {
    retries?: number;
    host: string;
  }
}
export type { Settings };
export {};
export type { Settings as $py$Settings };
