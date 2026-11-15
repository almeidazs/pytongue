/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
interface Ticket {
  ticketId: number;
  /** Short summary */
  title: string;
}
declare namespace Ticket {
  interface Input {
    ticketId: number;
    /** Short summary */
    title?: string;
  }
}
export type { Ticket };
export {};
export type { Ticket as $py$Ticket };
