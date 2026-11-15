# A generator annotated `Iterable[T]` becomes AsyncIterable<T>.
from typing import Iterable


def words(text: str) -> Iterable[str]:
    yield from text.split()
