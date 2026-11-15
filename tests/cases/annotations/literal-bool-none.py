# Literal True, False and None become true, false and null.
from typing import Literal


def f(a: Literal[True], b: Literal[True, False], c: Literal["on", None]) -> None: ...
