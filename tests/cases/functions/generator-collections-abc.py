# `collections.abc.Iterator[T]` is accepted like `typing.Iterator[T]`.
import collections.abc


def letters() -> collections.abc.Iterator[str]:
    yield "a"
