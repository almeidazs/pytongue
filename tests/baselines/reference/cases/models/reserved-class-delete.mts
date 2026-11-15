/* pytongue */
interface $delete {
  target: string;
  force: boolean;
}
declare namespace $delete {
  interface Input {
    target: string;
    force?: boolean;
  }
}
export type { $delete as delete };
export {};
export type { $delete as $py$delete };
