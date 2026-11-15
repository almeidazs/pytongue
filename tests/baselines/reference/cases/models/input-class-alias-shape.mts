/* pytongue */
interface Input {
  text: string;
}
type $Input$Input = Input;
declare namespace Input {
  type Input = $Input$Input;
}
declare function run(value: Input.Input): Promise<string>;
export type { Input };
export { run };
export type { Input as $py$Input, run as $py$run };
