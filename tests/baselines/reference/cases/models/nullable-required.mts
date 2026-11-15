/* pytongue */
interface Profile {
  bio: string | null;
  nickname: string | null;
}
declare namespace Profile {
  interface Input {
    bio: string | null;
    nickname?: string | null;
  }
}
export type { Profile };
export {};
export type { Profile as $py$Profile };
