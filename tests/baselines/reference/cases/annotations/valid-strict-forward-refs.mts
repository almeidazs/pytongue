/* pytongue */
interface Node {
  children: Node[];
}
declare namespace Node {
  interface Input {
    children?: Node.Input[];
  }
}
declare function f(a: Node.Input, b: Node.Input[], c: Node.Input | null): Promise<Node[]>;
export type { Node };
export { f };
export type { f as $py$f, Node as $py$Node };
