/* pytongue */
declare function mean(kwargs?: { weight?: number; }): Promise<number>;
declare function mean(values: number[], kwargs?: { weight?: number; }): Promise<number>;
export { mean };
export type { mean as $py$mean };
