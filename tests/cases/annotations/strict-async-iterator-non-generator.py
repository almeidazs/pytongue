# Strict: async iterator types are only valid as the return type of a generator.
# @strict: true
from typing import AsyncGenerator, AsyncIterable, AsyncIterator


def a() -> AsyncIterator[int]: ...  # E:12 pytongue1003
def b(x: AsyncIterable[str]) -> None: ...  # E:10 pytongue1003
def c() -> AsyncGenerator[int, None]: ...  # E:12 pytongue1003
