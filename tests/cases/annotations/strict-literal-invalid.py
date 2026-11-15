# Strict: a Literal value that is not a literal makes the whole Literal unknown.
# @strict: true
from typing import Literal


def f(
    a: Literal[str],  # E:8 pytongue1003
    b: Literal[f"x"],  # E:8 pytongue1003
    c: Literal[b"x"],  # E:8 pytongue1003
    d: Literal["ok", 1 + 2],  # E:8 pytongue1003
) -> None: ...
