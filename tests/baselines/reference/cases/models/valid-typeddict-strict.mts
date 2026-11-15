/* pytongue */
interface Env {
  name: string;
  region?: string;
}
declare namespace Env {
  type Input = Env;
}
export type { Env };
export {};
export type { Env as $py$Env };
