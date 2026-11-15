# Union and multi-value Literal elements are parenthesized before [].
from typing import Literal, Optional


def f(
    a: list[int | str],
    b: list[Optional[int]],
    c: list[Literal["a", "b"]],
    d: list[Literal["a"]],
    e: list[list[int | None]],
) -> None: ...
