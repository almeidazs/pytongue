# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
import asyncio
import datetime
import os
import threading
import time
from collections.abc import AsyncIterator, Iterator

from pydantic import BaseModel


class Item(BaseModel):
    name: str
    qty: int = 1


def echo(item: Item) -> Item:
    return item


def fail(message: str) -> None:
    raise ValueError(message)


def nan() -> float:
    return float("nan")


def big() -> int:
    return 2**60


def noisy(x: int) -> int:
    print("print() goes to stderr")
    os.write(1, b"a raw write to fd 1 goes to stderr too\n")
    return x * 2


def crash() -> None:
    os._exit(3)


async def sleepy(ms: int, tag: str) -> str:
    await asyncio.sleep(ms / 1000)
    return tag


_order: list[str] = []


def ordered(tag: str, ms: int) -> list[str]:
    time.sleep(ms / 1000)
    _order.append(tag)
    return list(_order)


def thread_name() -> str:
    return threading.current_thread().name


_closed: list[str] = []


def counter(n: int) -> Iterator[int]:
    try:
        for i in range(n):
            yield i
    finally:
        _closed.append("counter")


async def forever() -> AsyncIterator[int]:
    i = 0
    try:
        while True:
            yield i
            i += 1
    finally:
        _closed.append("forever")


def closed() -> list[str]:
    return list(_closed)


def day_after(d: datetime.date) -> datetime.date:
    return d + datetime.timedelta(days=1)


def nothing() -> None:
    return None


async def abandoned() -> AsyncIterator[int]:
    try:
        i = 0
        while True:
            yield i
            i += 1
    finally:
        _closed.append("abandoned")


_pulled: list[int] = []


def tracked(n: int) -> Iterator[int]:
    for i in range(n):
        _pulled.append(i)
        yield i


def pulled() -> list[int]:
    return list(_pulled)
