/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
interface Account {
  userId: number;
}
declare namespace Account {
  interface Input {
    user_id: number;
  }
}
export type { Account };
export {};
export type { Account as $py$Account };
