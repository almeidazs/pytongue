/* pytongue */
interface Order {
  /** Public id */
  orderId: string;
  /** Free text */
  customerNote: string | null;
}
declare namespace Order {
  interface Input {
    /** Public id */
    orderId: string;
    /** Free text */
    customerNote?: string | null;
  }
}
export type { Order };
export {};
export type { Order as $py$Order };
