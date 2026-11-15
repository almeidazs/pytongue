/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
interface Item {
  name: string;
  qty: number;
  tags: string[];
}
declare namespace Item {
  interface Input {
    name: string;
    qty?: number;
    tags?: string[];
  }
}
export type { Item };
export {};
export type { Item as $py$Item };
