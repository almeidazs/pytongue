"""Server: calls, keyword arguments, errors, concurrency and generator streams."""

import threading
import time
from collections.abc import Callable

from pytongue_bridge.protocol import JsonObject

Serve = Callable[[str, list[JsonObject]], list[JsonObject]]


def reply(sent: list[JsonObject], request_id: int) -> JsonObject:
    return next(m for m in sent if m.get("id") == request_id)


def test_call_returns_the_serialized_value(serve: Serve) -> None:
    sent = serve(
        """
        def add(a: int, b: int) -> int:
            return a + b
        """,
        [{"id": 1, "op": "call", "fn": "add", "args": [2, 3]}],
    )

    assert reply(sent, 1) == {"id": 1, "ok": True, "value": 5}


def test_args_rest_and_kwargs_are_combined(serve: Serve) -> None:
    sent = serve(
        """
        def f(a: int, *rest: int, scale: int = 1) -> list[int]:
            return [x * scale for x in (a, *rest)]
        """,
        [{"id": 1, "op": "call", "fn": "f", "args": [1], "rest": [2, 3], "kwargs": {"scale": 10}}],
    )

    assert reply(sent, 1)["value"] == [10, 20, 30]


def test_async_functions_are_awaited(serve: Serve) -> None:
    sent = serve(
        """
        import asyncio

        async def slow(x: int) -> int:
            await asyncio.sleep(0.01)
            return x + 1
        """,
        [{"id": 1, "op": "call", "fn": "slow", "args": [1]}],
    )

    assert reply(sent, 1)["value"] == 2


def test_exceptions_become_error_replies(serve: Serve) -> None:
    sent = serve(
        """
        def boom(message: str) -> None:
            raise ValueError(message)
        """,
        [{"id": 1, "op": "call", "fn": "boom", "args": ["nope"]}],
    )
    response = reply(sent, 1)
    error = response["error"]

    assert response["ok"] is False
    assert isinstance(error, dict)
    assert error["type"] == "ValueError"
    assert error["message"] == "nope"


def test_validation_failures_carry_the_pydantic_errors(serve: Serve) -> None:
    sent = serve(
        """
        def f(n: int) -> int:
            return n
        """,
        [{"id": 1, "op": "call", "fn": "f", "args": ["x"]}],
    )
    error = reply(sent, 1)["error"]

    assert isinstance(error, dict)
    assert error["type"] == "ValidationError"
    assert isinstance(error["validation"], list)


def test_a_missing_function_is_an_error_not_a_crash(serve: Serve) -> None:
    sent = serve("X = 1\n", [{"id": 1, "op": "call", "fn": "missing"}, {"id": 2, "op": "call", "fn": "X"}])

    assert reply(sent, 1)["ok"] is False
    assert "no function 'missing'" in str(reply(sent, 1)["error"])
    assert reply(sent, 2)["ok"] is False  # a non-callable is not a function either


def test_nan_results_become_errors(serve: Serve) -> None:
    sent = serve(
        """
        def f() -> float:
            return float("nan")
        """,
        [{"id": 1, "op": "call", "fn": "f"}],
    )
    response = reply(sent, 1)

    assert response["ok"] is False
    assert isinstance(response["error"], dict)
    assert response["error"]["type"] == "ValueError"


def test_huge_ints_become_errors(serve: Serve) -> None:
    sent = serve(
        """
        def f() -> int:
            return 2 ** 60
        """,
        [{"id": 1, "op": "call", "fn": "f"}],
    )

    assert isinstance(reply(sent, 1)["error"], dict)
    assert reply(sent, 1)["error"]["type"] == "OverflowError"  # type: ignore[index]


def test_sync_functions_run_in_order_on_one_dedicated_thread(serve: Serve) -> None:
    sent = serve(
        """
        import threading, time

        LOG = []

        def record(tag: str, delay: float) -> list[str]:
            time.sleep(delay)
            LOG.append(tag)
            return list(LOG)

        def thread_name() -> str:
            return threading.current_thread().name
        """,
        [
            {"id": 1, "op": "call", "fn": "record", "args": ["first", 0.2]},
            {"id": 2, "op": "call", "fn": "record", "args": ["second", 0]},
            {"id": 3, "op": "call", "fn": "thread_name"},
        ],
    )

    assert reply(sent, 2)["value"] == ["first", "second"]
    assert str(reply(sent, 3)["value"]).startswith("pytongue-sync")
    assert threading.current_thread().name not in str(reply(sent, 3)["value"])


def test_async_functions_run_concurrently(serve: Serve) -> None:
    started = time.monotonic()
    sent = serve(
        """
        import asyncio

        async def wait(tag: str) -> str:
            await asyncio.sleep(0.5)
            return tag
        """,
        [{"id": n, "op": "call", "fn": "wait", "args": [str(n)]} for n in range(1, 5)],
    )

    assert [reply(sent, n)["value"] for n in range(1, 5)] == ["1", "2", "3", "4"]
    assert time.monotonic() - started < 1.5  # four 0.5s waits overlapped


def test_a_sync_call_does_not_block_async_ones(serve: Serve) -> None:
    sent = serve(
        """
        import asyncio, time

        def block() -> str:
            time.sleep(0.6)
            return "slow"

        async def quick() -> str:
            return "fast"
        """,
        [{"id": 1, "op": "call", "fn": "block"}, {"id": 2, "op": "call", "fn": "quick"}],
    )
    order = [m["id"] for m in sent]

    assert order.index(2) < order.index(1)


STREAMS = """
CLOSED = []

def counter(n: int):
    try:
        for i in range(n):
            yield i
    finally:
        CLOSED.append("counter")

async def acounter(n: int):
    try:
        for i in range(n):
            yield i
    finally:
        CLOSED.append("acounter")

def closed() -> list[str]:
    return list(CLOSED)

def failing():
    yield 1
    raise RuntimeError("mid-stream")
"""


def stream(fn: str, count: int, *, args: list[object]) -> list[JsonObject]:
    return [
        {"id": 1, "op": "open", "stream": 7, "fn": fn, "args": args},
        *({"id": 2 + i, "op": "next", "stream": 7} for i in range(count)),
    ]


def test_a_sync_generator_streams_items_then_finishes(serve: Serve) -> None:
    sent = serve(STREAMS, stream("counter", 4, args=[3]))

    assert [reply(sent, i).get("value") for i in (2, 3, 4)] == [0, 1, 2]
    assert reply(sent, 5)["done"] is True
    assert reply(sent, 4)["done"] is False


def test_an_async_generator_streams_too(serve: Serve) -> None:
    sent = serve(STREAMS, stream("acounter", 3, args=[2]))

    assert [reply(sent, i).get("value") for i in (2, 3)] == [0, 1]
    assert reply(sent, 4)["done"] is True


def test_cancel_closes_the_generator(serve: Serve) -> None:
    sent = serve(
        STREAMS,
        [
            {"id": 1, "op": "open", "stream": 7, "fn": "counter", "args": [100]},
            {"id": 2, "op": "next", "stream": 7},
            {"op": "cancel", "stream": 7},
            {"id": 3, "op": "call", "fn": "closed"},
        ],
    )

    assert reply(sent, 3)["value"] == ["counter"]


def test_cancel_closes_an_async_generator(serve: Serve) -> None:
    sent = serve(
        STREAMS,
        [
            {"id": 1, "op": "open", "stream": 7, "fn": "acounter", "args": [100]},
            {"id": 2, "op": "next", "stream": 7},
            {"op": "cancel", "stream": 7},
            {"id": 3, "op": "call", "fn": "closed"},
        ],
    )

    assert reply(sent, 3)["value"] == ["acounter"]


def test_next_on_an_unknown_stream_is_done(serve: Serve) -> None:
    sent = serve(STREAMS, [{"id": 1, "op": "next", "stream": 999}])

    assert reply(sent, 1) == {"id": 1, "ok": True, "done": True}


def test_cancel_of_an_unknown_stream_is_ignored(serve: Serve) -> None:
    sent = serve(STREAMS, [{"op": "cancel", "stream": 999}, {"id": 1, "op": "call", "fn": "closed"}])

    assert reply(sent, 1)["value"] == []


def test_an_exception_in_a_generator_rejects_that_next(serve: Serve) -> None:
    sent = serve(STREAMS, stream("failing", 2, args=[]))

    assert reply(sent, 2)["value"] == 1
    assert reply(sent, 3)["ok"] is False
    assert "mid-stream" in str(reply(sent, 3)["error"])


def test_streams_are_independent(serve: Serve) -> None:
    sent = serve(
        STREAMS,
        [
            {"id": 1, "op": "open", "stream": 1, "fn": "counter", "args": [3]},
            {"id": 2, "op": "open", "stream": 2, "fn": "counter", "args": [3]},
            {"id": 3, "op": "next", "stream": 1},
            {"id": 4, "op": "next", "stream": 2},
            {"id": 5, "op": "next", "stream": 1},
        ],
    )

    assert [reply(sent, i)["value"] for i in (3, 4, 5)] == [0, 0, 1]
