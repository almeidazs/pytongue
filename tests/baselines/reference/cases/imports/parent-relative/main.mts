/* pytongue */
import type { $py$Wrapper as Wrapper } from "./sub/child.py";
declare function unwrap(w: Wrapper.Input): Promise<string>;
export { unwrap };
export type { Wrapper as $py$Wrapper, unwrap as $py$unwrap };
