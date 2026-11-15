/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
interface TreeNode {
  value: number;
  children: TreeNode[];
  parent: TreeNode | null;
}
declare namespace TreeNode {
  interface Input {
    value: number;
    children?: TreeNode.Input[];
    parent?: TreeNode.Input | null;
  }
}
export type { TreeNode };
export {};
export type { TreeNode as $py$TreeNode };
