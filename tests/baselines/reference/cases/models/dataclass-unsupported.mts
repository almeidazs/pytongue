/* pytongue */
/**
 * @remarks pytongue: class `Point` is not a BaseModel, TypedDict or Enum, so it is typed as `unknown`.
 */
declare function norm(p: unknown): Promise<number>;
export { norm };
type $Unknown = unknown;
declare namespace $Unknown {
  type Input = unknown;
}
export type { $Unknown as $py$Point, norm as $py$norm };
