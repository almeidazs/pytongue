/* pytongue */
import type { $py$Entity as Entity } from "./base.py";
interface Customer extends Entity {
  email: string;
}
declare namespace Customer {
  interface Input extends Entity.Input {
    email: string;
  }
}
export type { Customer };
export {};
export type { Entity as $py$Entity, Customer as $py$Customer };
