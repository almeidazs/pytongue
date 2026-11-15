/* pytongue */
import type { $py$Ids as Ids } from "./types.py";
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
declare function count(ids: Ids.Input): Promise<number>;
export { count };
export type { Ids as $py$Ids, count as $py$count };
