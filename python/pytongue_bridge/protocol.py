"""Types of the NDJSON protocol between Node and the worker."""

from typing import Literal, TypeAlias, TypedDict

#: A JSON object, as sent and received on the channel.
JsonObject: TypeAlias = dict[str, object]


class Request(TypedDict, total=False):
    """A request or notification from Node. Which keys are present depends on ``op``."""

    #: The operation.
    op: Literal["call", "open", "next", "cancel"]
    #: The request id; absent on ``cancel``, which gets no reply.
    id: int
    #: The function name (``call`` and ``open``).
    fn: str
    #: The stream id (``open``, ``next`` and ``cancel``).
    stream: int
    #: Positional arguments.
    args: list[object]
    #: The ``*args`` array, or ``None``.
    rest: list[object] | None
    #: Keyword arguments.
    kwargs: dict[str, object]
