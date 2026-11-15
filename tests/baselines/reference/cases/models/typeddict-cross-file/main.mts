/* pytongue */
import type { $py$Point as Point } from "./shapes.py";
interface Point3D extends Point {
  z: number;
}
declare namespace Point3D {
  interface Input extends Point.Input {
    z: number;
  }
}
export type { Point3D };
export {};
export type { Point as $py$Point, Point3D as $py$Point3D };
