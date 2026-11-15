/* pytongue */
import type { $py$Token as Token, $py$Span as Span } from "./models.py";
declare function locate(token: Token.Input): Promise<Span>;
export { locate };
export type { Token as $py$Token, Span as $py$Span, locate as $py$locate };
