/* pytongue */
interface Address {
  city: string;
}
declare namespace Address {
  type Input = Address;
}
interface Person {
  name: string;
  address: Address;
}
declare namespace Person {
  interface Input {
    name: string;
    address: Address.Input;
  }
}
export type { Address, Person };
export {};
export type { Address as $py$Address, Person as $py$Person };
