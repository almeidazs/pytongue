# Strict: Callable and type[...] cannot cross the process boundary.
# @strict: true
from typing import Callable, Type


def f(
    a: Callable[[int], str],  # E:8 pytongue1003
    b: type[int],  # E:8 pytongue1003
    c: Type[str],  # E:8 pytongue1003
    d: Callable,  # E:8 pytongue1003
) -> None: ...
