"""The worker's main loop."""

import asyncio
import os
import sys
import threading

from .channel import Channel
from .errors import error_payload
from .importer import import_user_module
from .protocol import Request
from .server import Server


def main(rpc_in_fd: int, rpc_out_fd: int, path: str) -> None:
    """Imports the user module, sends the ready handshake and serves requests until Node leaves.

    Args:
        rpc_in_fd: Descriptor requests arrive on.
        rpc_out_fd: Descriptor responses go to.
        path: The user module's file.
    """
    channel = Channel(rpc_in_fd, rpc_out_fd)

    try:
        module = import_user_module(path)
    except BaseException as exc:  # noqa: BLE001 - reported to Node as a startup failure
        channel.send({"ready": False, "error": error_payload(exc)})
        sys.exit(1)

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    server = Server(module, loop, channel)

    def on_message(message: Request) -> None:
        _ = loop.call_soon_threadsafe(server.dispatch, message)

    def read() -> None:
        channel.read(on_message)
        _ = loop.call_soon_threadsafe(loop.stop)  # Node went away

    threading.Thread(target=read, name="pytongue-rpc", daemon=True).start()
    channel.send({"ready": True})
    loop.run_forever()
    server.sync.shutdown(wait=False, cancel_futures=True)
    os._exit(0)
