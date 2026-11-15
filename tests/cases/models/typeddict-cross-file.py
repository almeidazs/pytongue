# A TypedDict base from another file is extended through its `$py$` surface.
from .shapes import Point


class Point3D(Point):
    z: float
# @filename: shapes.py
from typing import TypedDict


class Point(TypedDict):
    x: float
    y: float
