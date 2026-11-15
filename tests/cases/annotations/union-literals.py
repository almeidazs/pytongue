# A union of Literal types keeps every value.
from typing import Literal


def f(a: Literal["a"] | Literal["b"], b: Literal[1] | None, c: Literal["x"] | str) -> None: ...
