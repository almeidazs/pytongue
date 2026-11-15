# A literal `__all__` list decides the exports, in its order.
from pydantic import BaseModel

__all__ = ["Point", "norm"]


class Point(BaseModel):
    x: float
    y: float


def norm(p: Point) -> float:
    return (p.x**2 + p.y**2) ** 0.5


def unlisted(p: Point) -> float:
    return p.x
