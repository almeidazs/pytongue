# `__all__` decides which classes are exported; the surface still lists all of them.
from pydantic import BaseModel

__all__ = ["Public", "make"]


class Public(BaseModel):
    value: int


class Internal(BaseModel):
    value: int


def make() -> Public:
    return Public(value=1)
