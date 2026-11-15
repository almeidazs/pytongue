/* pytongue */
type Tier = 0 | 1;
declare namespace Tier {
  type Input = Tier;
}
type Region = "eu" | "us";
declare namespace Region {
  type Input = Region;
}
export type { Tier, Region };
export {};
export type { Tier as $py$Tier, Region as $py$Region };
