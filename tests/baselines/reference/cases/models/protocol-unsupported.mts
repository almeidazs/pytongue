/* pytongue */
/**
 * @remarks pytongue: class `Greeter` is not a BaseModel, TypedDict or Enum, so it is typed as `unknown`.
 */
declare function run(g: unknown): Promise<string>;
export { run };
type $Unknown = unknown;
declare namespace $Unknown {
  type Input = unknown;
}
export type { $Unknown as $py$Greeter, run as $py$run };
