# A sync generator annotated `Iterator[T]` becomes AsyncIterable<T>.
from typing import Iterator


def count(n: int) -> Iterator[int]:
    for i in range(n):
        yield i
