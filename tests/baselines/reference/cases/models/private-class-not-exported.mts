/* pytongue */
interface _Draft {
  text: string;
}
declare namespace _Draft {
  type Input = _Draft;
}
interface Final {
  draft: _Draft;
}
declare namespace Final {
  interface Input {
    draft: _Draft.Input;
  }
}
export type { Final };
export {};
export type { _Draft as $py$_Draft, Final as $py$Final };
