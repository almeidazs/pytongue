/* pytongue */
interface Product {
  /** Stock keeping unit */
  sku: string;
  /** Unit price in USD */
  price: number;
}
declare namespace Product {
  interface Input {
    /** Stock keeping unit */
    sku: string;
    /** Unit price in USD */
    price?: number;
  }
}
export type { Product };
export {};
export type { Product as $py$Product };
