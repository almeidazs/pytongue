/* pytongue */
interface Point {
  /** Horizontal position. */
  x: number;
  /** Vertical position.
   * 
   * Defaults to the baseline. */
  y: number;
}
declare namespace Point {
  interface Input {
    /** Horizontal position. */
    x: number;
    /** Vertical position.
     * 
     * Defaults to the baseline. */
    y?: number;
  }
}
export type { Point };
export {};
export type { Point as $py$Point };
