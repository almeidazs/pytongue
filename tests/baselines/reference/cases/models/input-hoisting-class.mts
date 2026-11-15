/* pytongue */
interface Input {
  text: string;
  lang: string;
}
interface $Input$Input {
  text: string;
  lang?: string;
}
declare namespace Input {
  type Input = $Input$Input;
}
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
interface Job {
  source: Input;
  priority: number;
}
interface $Input$Job {
  source: Input.Input;
  priority?: number;
}
declare namespace Job {
  type Input = $Input$Job;
}
export type { Input, Job };
export {};
export type { Input as $py$Input, Job as $py$Job };
