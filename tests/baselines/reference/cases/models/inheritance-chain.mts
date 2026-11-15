/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
interface Base {
  id: number;
}
declare namespace Base {
  type Input = Base;
}
interface Named extends Base {
  name: string;
}
declare namespace Named {
  interface Input extends Base.Input {
    name: string;
  }
}
interface Tagged extends Named {
  tags: string[];
}
declare namespace Tagged {
  interface Input extends Named.Input {
    tags?: string[];
  }
}
export type { Base, Named, Tagged };
export {};
export type { Base as $py$Base, Named as $py$Named, Tagged as $py$Tagged };
