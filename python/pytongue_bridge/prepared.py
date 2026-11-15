"""A user function wrapped with Pydantic validation and a result serializer."""

import inspect
import sys
import typing
from collections.abc import Callable
from typing import cast, final

from pydantic import ConfigDict, TypeAdapter, validate_call
from pydantic_core import to_jsonable_python

from .serialize import check_safe_ints

#: Return annotations of a generator whose first argument is the element type.
GENERATOR_ANNOTATIONS = (
    "Iterator",
    "Iterable",
    "Generator",
    "AsyncIterator",
    "AsyncIterable",
    "AsyncGenerator",
)

#: Lets Pydantic validate and serialize types it has no schema for (they pass through as-is).
CONFIG = ConfigDict(arbitrary_types_allowed=True)


@final
class Prepared:
    """A function with its validated wrapper and its result serializer."""

    def __init__(self, fn: Callable[..., object]) -> None:
        """Wraps a function.

        Args:
            fn: The user function.
        """
        self.fn = fn
        self.is_async_gen = inspect.isasyncgenfunction(fn)
        self.is_gen = inspect.isgeneratorfunction(fn)
        self.call = self._validated(fn)
        self.adapter = self._adapter()

    @staticmethod
    def _validated(fn: Callable[..., object]) -> Callable[..., object]:
        """Wraps a function with Pydantic argument validation.

        Args:
            fn: The user function.

        Returns:
            The validating wrapper, or the function itself when Pydantic cannot build a schema
            for its annotations.
        """
        try:
            return validate_call(config=CONFIG)(fn)
        except Exception as exc:
            print(f"pytongue: cannot validate {fn.__qualname__}: {exc}", file=sys.stderr)

            return fn

    def _return_hint(self) -> object:
        """Reads the annotation results are serialized against.

        Returns:
            The return annotation (the element type for a generator), or ``None``.
        """
        try:
            hints = typing.get_type_hints(self.fn, include_extras=True)
        except Exception:
            return None

        hint: object = hints.get("return")

        if not (self.is_gen or self.is_async_gen) or hint is None:
            return hint

        origin: object = typing.get_origin(hint)
        args: tuple[object, ...] = typing.get_args(hint)
        name = origin.__name__ if isinstance(origin, type) else ""

        return args[0] if args and name in GENERATOR_ANNOTATIONS else None

    def _adapter(self) -> TypeAdapter[object] | None:
        """Builds the ``TypeAdapter`` that serializes results.

        Returns:
            An adapter for the return annotation, or ``None`` when there is no usable one.
        """
        hint = self._return_hint()

        if hint is None or hint is typing.Any or hint is type(None):
            return None

        try:
            return TypeAdapter(cast(type[object], hint), config=CONFIG)
        except Exception:
            return None

    def serialize(self, value: object) -> object:
        """Turns a result into its JSON form.

        Args:
            value: What the function returned (or one generator item).

        Returns:
            The JSON-compatible value (aliases applied).

        Raises:
            OverflowError: When it holds an integer outside ±(2^53−1).
        """
        if self.adapter is not None:
            data = cast(object, self.adapter.dump_python(value, mode="json", by_alias=True))
        else:
            data = cast(object, to_jsonable_python(value, by_alias=True))

        check_safe_ints(data)

        return data
