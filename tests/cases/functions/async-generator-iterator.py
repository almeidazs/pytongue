# An async generator annotated `AsyncIterator[T]` becomes AsyncIterable<T>.
from typing import AsyncIterator


async def stream(chunks: int) -> AsyncIterator[bytes]:
    yield b""
