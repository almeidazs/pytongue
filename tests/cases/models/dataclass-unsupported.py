# A dataclass is not translated: references to it are `unknown` and its surface is `$Unknown`.
from dataclasses import dataclass


@dataclass
class Point:
    x: float
    y: float


def norm(p: Point) -> float:
    return (p.x**2 + p.y**2) ** 0.5
