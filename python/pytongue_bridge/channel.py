"""The NDJSON channel to Node, over the file descriptors split off at startup."""

import json
import os
import threading
from collections.abc import Callable
from typing import cast, final

from .protocol import JsonObject, Request


@final
class Channel:
    """Writes and reads one JSON object per line."""

    def __init__(self, in_fd: int, out_fd: int) -> None:
        """Wraps the RPC file descriptors.

        Args:
            in_fd: Descriptor Node writes requests to (the original stdin).
            out_fd: Descriptor responses go to (the original stdout).
        """
        self._in_fd = in_fd
        self._out = os.fdopen(out_fd, "wb", buffering=0)
        self._lock = threading.Lock()

    def send(self, message: JsonObject) -> None:
        """Writes one message. Safe to call from any thread.

        Args:
            message: A JSON-serializable object.

        Raises:
            ValueError: When the message holds NaN or Infinity (``allow_nan=False``).
            TypeError: When the message is not JSON-serializable.
        """
        text = json.dumps(message, allow_nan=False, ensure_ascii=False)
        data = text.encode("utf-8") + b"\n"

        with self._lock:
            _ = self._out.write(data)

    def read(self, on_message: Callable[[Request], None]) -> None:
        """Reads messages until Node closes the channel. Blocks; meant for a background thread.

        Args:
            on_message: Called once per decoded line, on the reading thread.
        """
        with os.fdopen(self._in_fd, encoding="utf-8", newline="\n") as stream:
            for line in stream:
                if line.strip():
                    on_message(cast(Request, json.loads(line)))
