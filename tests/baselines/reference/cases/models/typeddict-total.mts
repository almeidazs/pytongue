/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
interface Movie {
  title: string;
  year: number;
}
declare namespace Movie {
  type Input = Movie;
}
export type { Movie };
export {};
export type { Movie as $py$Movie };
