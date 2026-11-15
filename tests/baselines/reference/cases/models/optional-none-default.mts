/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
interface Query {
  term: string;
  limit: number | null;
}
declare namespace Query {
  interface Input {
    term: string;
    limit?: number | null;
  }
}
export type { Query };
export {};
export type { Query as $py$Query };
