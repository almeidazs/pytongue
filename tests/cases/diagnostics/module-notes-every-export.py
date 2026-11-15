# Module notes from `__all__` appear on every exported declaration.
from pydantic import BaseModel

__all__ = ["Point", "norm", "scale", "ghost"]


class Point(BaseModel):
    x: float
    y: float


def norm(p: Point) -> float:
    return (p.x**2 + p.y**2) ** 0.5


def scale(p: Point, k: float) -> Point:
    return Point(x=p.x * k, y=p.y * k)
