/* pytongue */
interface Timestamps {
  created: string;
}
declare namespace Timestamps {
  type Input = Timestamps;
}
interface Owned {
  owner: string;
}
declare namespace Owned {
  type Input = Owned;
}
interface Doc extends Timestamps, Owned {
  body: string;
}
declare namespace Doc {
  interface Input extends Timestamps.Input, Owned.Input {
    body: string;
  }
}
export type { Timestamps, Owned, Doc };
export {};
export type { Timestamps as $py$Timestamps, Owned as $py$Owned, Doc as $py$Doc };
