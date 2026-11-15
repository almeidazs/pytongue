/* pytongue */
interface Point {
  x: number;
  y: number;
}
declare namespace Point {
  type Input = Point;
}
declare function norm(p: Point.Input): Promise<number>;
export type { Point };
export { norm };
export type { Point as $py$Point, norm as $py$norm };
