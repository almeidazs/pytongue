/* pytongue */
/**
 * @remarks pytongue: class `Money` is not a BaseModel, TypedDict or Enum, so it is typed as `unknown`.
 */
interface Invoice {
  total: unknown;
}
declare namespace Invoice {
  type Input = Invoice;
}
/**
 * @remarks pytongue: class `Money` is not a BaseModel, TypedDict or Enum, so it is typed as `unknown`.
 */
declare function pay(m: unknown): Promise<void>;
export type { Invoice };
export { pay };
type $Unknown = unknown;
declare namespace $Unknown {
  type Input = unknown;
}
export type { $Unknown as $py$Money, Invoice as $py$Invoice, pay as $py$pay };
