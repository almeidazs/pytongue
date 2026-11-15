/* pytongue */
/**
 * @remarks pytongue: `ghost` is listed in `__all__` but not defined.
 */
interface Point {
  x: number;
  y: number;
}
declare namespace Point {
  type Input = Point;
}
/**
 * @remarks pytongue: `ghost` is listed in `__all__` but not defined.
 */
declare function norm(p: Point.Input): Promise<number>;
/**
 * @remarks pytongue: `ghost` is listed in `__all__` but not defined.
 */
declare function scale(p: Point.Input, k: number): Promise<Point>;
export type { Point };
export { norm, scale };
export type { Point as $py$Point, norm as $py$norm, scale as $py$scale };
