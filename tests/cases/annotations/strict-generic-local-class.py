# Strict: subscripting a local class or alias is not supported yet; the bare class is fine.
# @strict: true
from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")
Pair = tuple[int, int]


class Box(BaseModel, Generic[T]):
    value: int


def f(
    a: Box,
    b: Box[int],  # E:8 pytongue1003
    c: Pair[int],  # E:8 pytongue1003
) -> None: ...
