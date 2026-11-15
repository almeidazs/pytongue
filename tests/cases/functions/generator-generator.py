# `Generator[T, S, R]` uses only the yield type T.
from typing import Generator


def ticks() -> Generator[float, None, None]:
    yield 0.5
