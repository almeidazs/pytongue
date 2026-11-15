/* pytongue */
type Perm = 1 | 2 | 4;
declare namespace Perm {
  type Input = Perm;
}
type Mode = 4 | 8 | 16;
declare namespace Mode {
  type Input = Mode;
}
export type { Perm, Mode };
export {};
export type { Perm as $py$Perm, Mode as $py$Mode };
