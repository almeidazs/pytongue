# A bare `Iterator` without a type argument yields unknown.
from typing import Iterator


def values() -> Iterator:
    yield 1
