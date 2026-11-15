# @strict: true
# should not generate diagnostics
from typing import AsyncIterator, Iterator


def sync_items() -> Iterator[str]:
    yield ""


async def async_items() -> AsyncIterator[int]:
    yield 0
