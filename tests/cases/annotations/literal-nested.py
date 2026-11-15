# Nested Literal types are flattened into one.
from typing import Literal


def f(a: Literal[Literal["a", "b"], "c"], b: Literal[Literal[Literal[1]], 2]) -> None: ...
