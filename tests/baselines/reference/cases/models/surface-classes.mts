/* pytongue */
type Mode = "on" | "off";
declare namespace Mode {
  type Input = Mode;
}
interface Config {
  mode: Mode;
}
declare namespace Config {
  interface Input {
    mode: Mode.Input;
  }
}
export type { Mode, Config };
export {};
type $Unknown = unknown;
declare namespace $Unknown {
  type Input = unknown;
}
export type { Mode as $py$Mode, $Unknown as $py$Helper, Config as $py$Config };
