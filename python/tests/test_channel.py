"""Channel: NDJSON over real pipes, the way Node talks to the worker."""

import contextlib
import json
import os
import threading
from collections.abc import Iterator

import pytest
from hypothesis import given, settings
from hypothesis import strategies as st

from pytongue_bridge.channel import Channel
from pytongue_bridge.protocol import JsonObject, Request

json_values = st.recursive(
    st.none() | st.booleans() | st.integers(-(2**53), 2**53) | st.floats(allow_nan=False, allow_infinity=False) | st.text(),
    lambda children: st.lists(children) | st.dictionaries(st.text(), children),
    max_leaves=15,
)


@contextlib.contextmanager
def pipe_channel() -> Iterator[tuple[Channel, int, int]]:
    """A channel whose output is readable at `out_read` and whose input is fed through `in_write`.

    Every descriptor is closed on exit, whichever side the test already closed.
    """
    out_read, out_write = os.pipe()
    in_read, in_write = os.pipe()
    channel = Channel(in_read, out_write)

    try:
        yield channel, out_read, in_write
    finally:
        for fd in (out_read, in_write, in_read):
            with contextlib.suppress(OSError):
                os.close(fd)

        channel._out.close()  # noqa: SLF001


def finish(channel: Channel, out_read: int) -> list[str]:
    """Closes the channel's output and returns what was written, one entry per line.

    Lines split on `\n` only, like the protocol: `str.splitlines` would also split on
    `\x85`, `\u2028` and friends, which are legal inside a JSON string.
    """
    channel._out.close()  # noqa: SLF001

    with os.fdopen(out_read, encoding="utf-8", newline="\n") as stream:
        text = stream.read()

    return text.split("\n")[:-1] if text else []


def test_send_writes_one_json_line() -> None:
    with pipe_channel() as (channel, out_read, _):
        channel.send({"id": 1, "ok": True, "value": [1, 2]})

        assert finish(channel, out_read) == ['{"id": 1, "ok": true, "value": [1, 2]}']


def test_send_keeps_unicode_unescaped() -> None:
    with pipe_channel() as (channel, out_read, _):
        channel.send({"text": "ótimo 🎉"})

        assert finish(channel, out_read) == ['{"text": "ótimo 🎉"}']


@pytest.mark.parametrize("bad", [float("nan"), float("inf"), float("-inf")])
def test_send_rejects_non_finite_numbers_and_writes_nothing(bad: float) -> None:
    with pipe_channel() as (channel, out_read, _):
        with pytest.raises(ValueError):
            channel.send({"value": bad})

        assert finish(channel, out_read) == []


def test_send_rejects_values_that_are_not_json() -> None:
    with pipe_channel() as (channel, out_read, _):
        with pytest.raises(TypeError):
            channel.send({"value": object()})

        assert finish(channel, out_read) == []


def test_concurrent_senders_never_interleave_lines() -> None:
    with pipe_channel() as (channel, out_read, _):
        lines: list[str] = []

        # A pipe holds ~64 KiB and these writers send ~800 KB: drain while they write.
        def drain() -> None:
            with os.fdopen(os.dup(out_read), encoding="utf-8", newline="\n") as stream:
                lines.extend(line.rstrip("\n") for line in stream)

        def burst(n: int) -> None:
            for _ in range(50):
                channel.send({"id": n, "pad": "x" * 2000})

        reader = threading.Thread(target=drain)
        senders = [threading.Thread(target=burst, args=(n,)) for n in range(8)]

        reader.start()

        for sender in senders:
            sender.start()

        for sender in senders:
            sender.join()

        channel._out.close()  # noqa: SLF001
        os.close(out_read)
        reader.join(timeout=20)

        assert len(lines) == 400
        assert all(json.loads(line)["pad"] == "x" * 2000 for line in lines)


def test_read_decodes_requests_until_eof_and_skips_blank_lines() -> None:
    with pipe_channel() as (channel, _, in_write):
        received: list[Request] = []

        with os.fdopen(in_write, "w", encoding="utf-8") as feed:
            _ = feed.write('{"id": 1, "op": "call", "fn": "f"}\n\n   \n{"op": "cancel", "stream": 2}\n')

        channel.read(received.append)

        assert received == [{"id": 1, "op": "call", "fn": "f"}, {"op": "cancel", "stream": 2}]


def test_read_handles_a_message_split_across_writes() -> None:
    with pipe_channel() as (channel, _, in_write):
        received: list[Request] = []
        reader = threading.Thread(target=lambda: channel.read(received.append))

        reader.start()

        with os.fdopen(in_write, "w", encoding="utf-8") as feed:
            _ = feed.write('{"id": 1, "op": "ca')
            feed.flush()
            _ = feed.write('ll", "fn": "f"}\n')

        reader.join(timeout=5)

        assert received == [{"id": 1, "op": "call", "fn": "f"}]


@pytest.mark.parametrize("separator", ["\x85", "\u2028", "\u2029", "\r", "\x0b", "\x0c", "\x1c"])
def test_unicode_line_separators_inside_a_message_do_not_split_it(separator: str) -> None:
    with pipe_channel() as (channel, out_read, in_write):
        message: JsonObject = {"text": f"a{separator}b"}

        channel.send(message)
        (line,) = finish(channel, out_read)

        with os.fdopen(in_write, "w", encoding="utf-8", newline="\n") as feed:
            _ = feed.write(line + "\n")

        received: list[Request] = []

        channel.read(received.append)

        assert received == [message]


@settings(max_examples=60)
@given(json_values)
def test_roundtrip(value: object) -> None:
    with pipe_channel() as (channel, out_read, in_write):
        message: JsonObject = {"value": value}

        channel.send(message)
        (line,) = finish(channel, out_read)

        with os.fdopen(in_write, "w", encoding="utf-8", newline="\n") as feed:
            _ = feed.write(line + "\n")

        received: list[Request] = []

        channel.read(received.append)

        assert received == [message]
