/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
interface Config {
  name: string;
  retries: number;
}
declare namespace Config {
  interface Input {
    name: string;
    retries?: number;
  }
}
export type { Config };
export {};
export type { Config as $py$Config };
