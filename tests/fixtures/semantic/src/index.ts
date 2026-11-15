import { f } from "./bad.py";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
function expectType<T extends true>(_?: T): void {}

// A deliberately wrong assertion: proves the assertions in examples/ are really checked.
expectType<Equal<ReturnType<typeof f>, Promise<string>>>();

export const n: string = await f(1, 2);
