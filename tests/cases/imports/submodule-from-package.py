# from .pkg import sub, where sub is pkg/sub.py, is a module import.
from .pkg import sub


def f(t: sub.Thing) -> None: ...
# @filename: pkg/__init__.py
# @filename: pkg/sub.py
from pydantic import BaseModel


class Thing(BaseModel):
    n: int
