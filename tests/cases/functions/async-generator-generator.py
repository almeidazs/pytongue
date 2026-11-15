# `AsyncGenerator[T, S]` uses only the yield type T.
from collections.abc import AsyncGenerator


async def events() -> AsyncGenerator[str, None]:
    yield "start"
