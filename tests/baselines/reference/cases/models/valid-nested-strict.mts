/* pytongue */
interface Node {
  children: Node[];
}
declare namespace Node {
  interface Input {
    children?: Node.Input[];
  }
}
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
interface Leaf extends Node {
  value: number;
}
declare namespace Leaf {
  interface Input extends Node.Input {
    value: number;
  }
}
export type { Node, Leaf };
export {};
export type { Node as $py$Node, Leaf as $py$Leaf };
