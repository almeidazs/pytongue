/* pytongue */
import type { $py$Token as Token } from "./slow.py";
declare function first(tokens: Token.Input[]): Promise<Token>;
export { first };
export type { Token as $py$Token, first as $py$first };
