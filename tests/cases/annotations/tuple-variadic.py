# `tuple[T, ...]` is a homogeneous array.
from typing import Tuple


def f(a: tuple[int, ...], b: Tuple[str, ...], c: tuple[int | None, ...]) -> None: ...
