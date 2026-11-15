/* pytongue */
import type * as models from "./models.py";
/**
 * @remarks pytongue: cannot resolve `models.inner.Token`, so it is typed as `unknown`.
 */
declare function first(token: unknown): Promise<string>;
export { first };
export type { models as $py$models, first as $py$first };
