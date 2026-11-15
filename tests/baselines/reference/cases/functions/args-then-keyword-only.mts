/* pytongue */
declare function tag(kwargs: { color: string; bold?: boolean; }): Promise<string[]>;
declare function tag(names: string[], kwargs: { color: string; bold?: boolean; }): Promise<string[]>;
export { tag };
export type { tag as $py$tag };
