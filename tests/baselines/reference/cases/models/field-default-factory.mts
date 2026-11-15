/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
interface Cart {
  items: string[];
  meta: Record<string, number>;
}
declare namespace Cart {
  interface Input {
    items?: string[];
    meta?: Record<string, number>;
  }
}
export type { Cart };
export {};
export type { Cart as $py$Cart };
