# `X: TypeAlias = ...` is a type alias, even for a bare name or a string.
from typing import TypeAlias

Ids: TypeAlias = list[int]
Name: TypeAlias = str
Ref: TypeAlias = "dict[str, int]"


def f(a: Ids, b: Name, c: Ref) -> None: ...
