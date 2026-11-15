"""Shared fixtures: the worker's channel, backed by in-memory buffers, and a module factory."""

import asyncio
import sys
import textwrap
from collections.abc import Callable, Iterator
from pathlib import Path
from types import ModuleType

import pytest

from pytongue_bridge.channel import Channel
from pytongue_bridge.importer import import_user_module
from pytongue_bridge.protocol import JsonObject
from pytongue_bridge.server import Server


class RecordingChannel(Channel):
    """A channel that records every message instead of writing it."""

    def __init__(self) -> None:
        self.sent: list[JsonObject] = []

    def send(self, message: JsonObject) -> None:
        # Serialize like the real channel, so NaN/Infinity fail the same way.
        import json

        _ = json.dumps(message, allow_nan=False)
        self.sent.append(message)


@pytest.fixture
def write_module(tmp_path: Path) -> Callable[[str, str], Path]:
    """Writes a dedented Python source file under a fresh directory."""

    def write(name: str, source: str) -> Path:
        path = tmp_path / name
        path.parent.mkdir(parents=True, exist_ok=True)
        _ = path.write_text(textwrap.dedent(source))

        return path

    return write


@pytest.fixture
def load_module(write_module: Callable[[str, str], Path]) -> Iterator[Callable[[str], ModuleType]]:
    """Imports a source string as a user module, and unloads it afterwards."""
    before = set(sys.modules)
    counter = iter(range(10_000))

    def load(source: str) -> ModuleType:
        return import_user_module(str(write_module(f"user{next(counter)}.py", source)))

    yield load

    for name in set(sys.modules) - before:
        del sys.modules[name]


@pytest.fixture
def serve(
    load_module: Callable[[str], ModuleType],
) -> Callable[[str, list[JsonObject]], list[JsonObject]]:
    """Runs requests against a module served by a real `Server`, returning what it replied."""

    def run(source: str, requests: list[JsonObject]) -> list[JsonObject]:
        module = load_module(source)
        loop = asyncio.new_event_loop()
        channel = RecordingChannel()
        server = Server(module, loop, channel)

        expected = sum(1 for request in requests if "id" in request)

        async def drive() -> None:
            for request in requests:
                server.dispatch(request)  # type: ignore[arg-type]
                await asyncio.sleep(0.02)

            # Every request with an id gets exactly one reply; wait for them all.
            for _ in range(500):
                if len(channel.sent) >= expected:
                    break

                await asyncio.sleep(0.02)

            await asyncio.sleep(0.05)  # let late notifications (cancel) settle

        try:
            loop.run_until_complete(drive())
        finally:
            server.sync.shutdown(wait=True)
            loop.close()

        return channel.sent

    return run
