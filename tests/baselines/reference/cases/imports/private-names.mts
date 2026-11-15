/* pytongue */
interface _Draft {
  text: string;
}
declare namespace _Draft {
  type Input = _Draft;
}
interface Note {
  text: string;
}
declare namespace Note {
  type Input = Note;
}
declare function publish(note: Note.Input): Promise<string>;
export type { Note };
export { publish };
export type { _Draft as $py$_Draft, Note as $py$Note, publish as $py$publish };
