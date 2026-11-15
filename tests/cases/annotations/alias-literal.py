# A module-level `X = Literal[...]` is a type alias.
from typing import Literal

Mode = Literal["read", "write"]


def f(m: Mode) -> Mode: ...
