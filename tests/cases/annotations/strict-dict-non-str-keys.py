# Strict: dict keys that are not strings cannot cross into JSON.
# @strict: true
from typing import Literal


def f(
    a: dict[int, str],  # E:8 pytongue1003
    b: dict[tuple[int, int], str],  # E:8 pytongue1003
    c: dict[Literal[1, 2], str],  # E:8 pytongue1003
    d: dict[str | int, str],  # E:8 pytongue1003
    e: dict[Literal["a", 1], str],  # E:8 pytongue1003
) -> None: ...
