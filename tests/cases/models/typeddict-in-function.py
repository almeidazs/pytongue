# A TypedDict parameter uses its `.Input`, and a return uses the TypedDict itself.
from typing import TypedDict


class Point(TypedDict):
    x: float
    y: float


def mirror(p: Point) -> Point:
    return {"x": -p["x"], "y": p["y"]}
