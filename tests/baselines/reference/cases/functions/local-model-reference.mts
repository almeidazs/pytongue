/* pytongue */
interface User {
  name: string;
}
declare namespace User {
  type Input = User;
}
declare function save(user: User.Input, kwargs?: { notify?: User.Input | null; }): Promise<User>;
export type { User };
export { save };
export type { User as $py$User, save as $py$save };
