# Optional[X] adds null once, even when nested or wrapping None.
from typing import Optional


def f(a: Optional[int], b: Optional[Optional[str]], c: Optional[None], d: Optional[list[int]]) -> None: ...
