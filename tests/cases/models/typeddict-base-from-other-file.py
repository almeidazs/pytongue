# A TypedDict subclass of a TypedDict from another file keeps total=False and NotRequired.
from typing import NotRequired

from .shapes import Point


class Opt(Point, total=False):
    z: float


class Nr(Point):
    w: NotRequired[float]
# @filename: shapes.py
from typing import TypedDict


class Point(TypedDict):
    x: float
    y: float
