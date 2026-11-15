/* pytongue */
type Method = "get" | "post" | "patch";
declare namespace Method {
  type Input = Method;
}
export type { Method };
export {};
export type { Method as $py$Method };
