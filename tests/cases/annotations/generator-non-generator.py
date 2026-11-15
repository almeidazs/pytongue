# Generator[T, ...] on a function that does not yield is an array of T.
from typing import Generator


def items() -> Generator[int, None, None]:
    return iter([])
