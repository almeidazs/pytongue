# int | float is one number, in every spelling.
from typing import Union


def f(b: int | float, c: Union[int, float], d: list[int | float]) -> float: ...
