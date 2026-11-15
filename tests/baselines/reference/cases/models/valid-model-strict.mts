/* pytongue */
interface Invoice {
  invoiceNumber: string;
  lines: number[];
  paid: boolean;
  total: number;
}
declare namespace Invoice {
  interface Input {
    invoiceNumber: string;
    lines?: number[];
    paid?: boolean;
  }
}
export type { Invoice };
export {};
export type { Invoice as $py$Invoice };
