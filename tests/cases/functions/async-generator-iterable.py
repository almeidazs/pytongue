# An async generator annotated `AsyncIterable[T]` becomes AsyncIterable<T>.
from typing import AsyncIterable


async def lines(path: str) -> AsyncIterable[str]:
    yield path
