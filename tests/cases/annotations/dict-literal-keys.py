# dict with Literal string keys becomes Partial<Record<keys, V>>.
from typing import Literal

Color = Literal["red", "green"]


def f(a: dict[Literal["a", "b"], int], b: dict[Color, float], c: dict[Literal["only"], str]) -> None: ...
