/* pytongue */
type Status = "open" | "closed";
declare namespace Status {
  type Input = Status;
}
interface Issue {
  status: Status;
}
declare namespace Issue {
  interface Input {
    status?: Status.Input;
  }
}
export type { Status, Issue };
export {};
export type { Status as $py$Status, Issue as $py$Issue };
