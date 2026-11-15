/* pytongue */
type Perm = 1 | 2 | 4;
declare namespace Perm {
  type Input = Perm;
}
type Bits = 1 | 128;
declare namespace Bits {
  type Input = Bits;
}
export type { Perm, Bits };
export {};
export type { Perm as $py$Perm, Bits as $py$Bits };
