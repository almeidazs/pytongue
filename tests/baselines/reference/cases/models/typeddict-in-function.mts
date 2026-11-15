/* pytongue */
interface Point {
  x: number;
  y: number;
}
declare namespace Point {
  type Input = Point;
}
declare function mirror(p: Point.Input): Promise<Point>;
export type { Point };
export { mirror };
export type { Point as $py$Point, mirror as $py$mirror };
