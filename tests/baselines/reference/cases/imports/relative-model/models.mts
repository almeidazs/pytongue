/* pytongue */
interface Token {
  text: string;
  pos: string | null;
}
declare namespace Token {
  interface Input {
    text: string;
    pos?: string | null;
  }
}
export type { Token };
export {};
export type { Token as $py$Token };
