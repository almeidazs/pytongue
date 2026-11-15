# A generic model `BaseModel, Generic[T]` is not supported.
from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class Box(BaseModel, Generic[T]):
    item: T


def unbox(b: Box[int]) -> int:
    return b.item
