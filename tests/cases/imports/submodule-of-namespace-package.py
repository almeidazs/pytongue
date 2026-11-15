# A directory with no __init__.py is a namespace package: its modules import the same way.
from .nspkg import mod


def f(t: mod.Thing) -> None: ...
# @filename: nspkg/mod.py
from pydantic import BaseModel


class Thing(BaseModel):
    n: int
