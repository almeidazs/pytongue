/* pytongue */
interface $string {
  value: string;
}
declare namespace $string {
  type Input = $string;
}
declare function echo(s: $string.Input): Promise<$string>;
export type { $string as string };
export { echo };
export type { $string as $py$string, echo as $py$echo };
