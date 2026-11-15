"""Dispatching Node's requests: calls, and generator streams."""

import asyncio
import concurrent.futures
import inspect
import traceback
import types
from collections.abc import AsyncGenerator, Callable, Coroutine, Generator
from dataclasses import dataclass, field
from typing import cast, final

from .channel import Channel
from .errors import error_payload
from .prepared import Prepared
from .protocol import JsonObject, Request

#: Marks the end of a sync generator, since ``None`` is a valid item.
EXHAUSTED = object()


@dataclass
class Stream:
    """An open generator, iterated one ``next`` at a time."""

    #: The generator; one of the two is set.
    sync_gen: Generator[object, None, None] | None
    async_gen: AsyncGenerator[object, None] | None
    #: Serializes the generator's items.
    prepared: Prepared
    #: Keeps ``next`` and ``cancel`` on one stream in order.
    lock: asyncio.Lock = field(default_factory=asyncio.Lock)


@final
class Server:
    """Serves one imported module. Async functions run concurrently on the event loop; sync
    functions and sync generators run on one dedicated thread, in arrival order."""

    def __init__(
        self, module: types.ModuleType, loop: asyncio.AbstractEventLoop, channel: Channel
    ) -> None:
        """Creates the server.

        Args:
            module: The imported user module.
            loop: The event loop requests are dispatched on.
            channel: Where responses go.
        """
        self.module = module
        self.loop = loop
        self.channel = channel
        self.sync = concurrent.futures.ThreadPoolExecutor(
            max_workers=1, thread_name_prefix="pytongue-sync"
        )
        self.prepared: dict[str, Prepared] = {}
        self.streams: dict[int, Stream] = {}
        self.tasks: set[asyncio.Task[None]] = set()

    def dispatch(self, message: Request) -> None:
        """Schedules one request. Called on the event loop thread.

        Args:
            message: The decoded request.
        """
        op = message.get("op")

        if op == "call":
            self._spawn(self._guard(message, self._call(message)))
        elif op == "open":
            self._spawn(self._guard(message, self._open(message)))
        elif op == "next":
            self._spawn(self._guard(message, self._next(message)))
        elif op == "cancel":
            self._spawn(self._cancel(message.get("stream", -1)))

    def _spawn(self, work: Coroutine[object, object, None]) -> None:
        """Runs a coroutine as a task, keeping a reference so it is not garbage-collected.

        Args:
            work: The coroutine.
        """
        task = self.loop.create_task(work)

        self.tasks.add(task)
        task.add_done_callback(self.tasks.discard)

    def _prepare(self, name: str) -> Prepared:
        """Finds and wraps a module function, once.

        Args:
            name: The function name.

        Returns:
            The prepared function.

        Raises:
            AttributeError: When the module has no such function.
        """
        prepared = self.prepared.get(name)

        if prepared is not None:
            return prepared

        fn: object = getattr(self.module, name, None)

        if not callable(fn):
            raise AttributeError(f"module {self.module.__name__!r} has no function {name!r}")

        prepared = Prepared(fn)
        self.prepared[name] = prepared

        return prepared

    def _reply(self, message: JsonObject) -> None:
        """Sends a response, turning a serialization failure (NaN, Infinity) into an error.

        Args:
            message: The response.
        """
        try:
            self.channel.send(message)
        except (ValueError, TypeError) as exc:
            self.channel.send({"id": message.get("id"), "ok": False, "error": error_payload(exc)})

    async def _guard(
        self, message: Request, work: Coroutine[object, object, JsonObject]
    ) -> None:
        """Runs a request and sends its response, or its error.

        Args:
            message: The request.
            work: The coroutine that handles it.

        Raises:
            KeyboardInterrupt: Re-raised after reporting, so the worker exits.
            SystemExit: Re-raised after reporting, so the worker exits.
        """
        request_id = message.get("id")

        try:
            result = await work
            self._reply({"id": request_id, "ok": True, **result})
        except BaseException as exc:  # noqa: BLE001 - every failure goes back to Node
            self.channel.send({"id": request_id, "ok": False, "error": error_payload(exc)})

            if isinstance(exc, (KeyboardInterrupt, SystemExit)):
                raise

    @staticmethod
    def _arguments(message: Request) -> tuple[list[object], dict[str, object]]:
        """Reads the call arguments of a request.

        Args:
            message: A ``call`` or ``open`` request.

        Returns:
            The positional arguments (``*args`` appended) and the keyword arguments.
        """
        args = [*message.get("args", []), *(message.get("rest") or [])]

        return args, dict(message.get("kwargs", {}))

    def _in_thread(self, work: Callable[[], object]) -> "asyncio.Future[object]":
        """Runs blocking work on the dedicated sync thread.

        Args:
            work: The blocking call.

        Returns:
            A future of its result.
        """
        return self.loop.run_in_executor(self.sync, work)

    async def _call(self, message: Request) -> JsonObject:
        """Handles ``call``.

        Args:
            message: The request.

        Returns:
            ``{"value": ...}`` with the serialized result.
        """
        prepared = self._prepare(message.get("fn", ""))
        args, kwargs = self._arguments(message)

        if inspect.iscoroutinefunction(prepared.fn):
            result = prepared.call(*args, **kwargs)
        else:
            result = await self._in_thread(lambda: prepared.call(*args, **kwargs))

        if inspect.isawaitable(result):
            result = cast(object, await result)

        return {"value": prepared.serialize(result)}

    async def _open(self, message: Request) -> JsonObject:
        """Handles ``open``: creates the generator of a stream.

        Args:
            message: The request.

        Returns:
            An empty object.
        """
        prepared = self._prepare(message.get("fn", ""))
        args, kwargs = self._arguments(message)

        if prepared.is_async_gen:
            created = prepared.call(*args, **kwargs)
        else:
            created = await self._in_thread(lambda: prepared.call(*args, **kwargs))

        if inspect.isawaitable(created) and not hasattr(created, "__anext__"):
            created = cast(object, await created)

        if hasattr(created, "__anext__"):
            stream = Stream(None, cast(AsyncGenerator[object, None], created), prepared)
        else:
            stream = Stream(cast(Generator[object, None, None], created), None, prepared)

        self.streams[message.get("stream", -1)] = stream

        return {}

    async def _next(self, message: Request) -> JsonObject:
        """Handles ``next``: takes one item, in order, per stream.

        Args:
            message: The request.

        Returns:
            ``{"done": False, "value": ...}``, or ``{"done": True}`` when exhausted.
        """
        stream_id = message.get("stream", -1)
        stream = self.streams.get(stream_id)

        if stream is None:
            return {"done": True}

        async with stream.lock:
            value = await self._take(stream)

        if value is EXHAUSTED:
            _ = self.streams.pop(stream_id, None)

            return {"done": True}

        return {"done": False, "value": stream.prepared.serialize(value)}

    async def _take(self, stream: Stream) -> object:
        """Takes one item from a generator.

        Args:
            stream: The stream.

        Returns:
            The item, or ``EXHAUSTED``.
        """
        if stream.async_gen is not None:
            try:
                return await anext(stream.async_gen)
            except StopAsyncIteration:
                return EXHAUSTED

        sync_gen = stream.sync_gen

        if sync_gen is None:
            return EXHAUSTED

        return await self._in_thread(lambda: next(sync_gen, EXHAUSTED))

    async def _cancel(self, stream_id: int) -> None:
        """Handles ``cancel``: closes a generator (``close()`` / ``aclose()``).

        Args:
            stream_id: The stream to close.
        """
        stream = self.streams.pop(stream_id, None)

        if stream is None:
            return

        try:
            async with stream.lock:
                if stream.async_gen is not None:
                    await stream.async_gen.aclose()
                elif stream.sync_gen is not None:
                    _ = await self._in_thread(stream.sync_gen.close)
        except Exception:
            traceback.print_exc()
