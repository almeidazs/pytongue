/* pytongue */
type Size = "s" | "l";
declare namespace Size {
  type Input = Size;
}
type Code = 200 | 404;
declare namespace Code {
  type Input = Code;
}
export type { Size, Code };
export {};
export type { Size as $py$Size, Code as $py$Code };
