# Strict: a function, a variable, a plain class and a class attribute are not types.
# @strict: true
from pydantic import BaseModel


def helper() -> int: ...


LIMIT = 3


class Plain:
    pass


class Model(BaseModel):
    x: int


def f(
    a: helper,  # E:8 pytongue1003
    b: LIMIT,  # E:8 pytongue1003
    c: Plain,  # E:8 pytongue1003
    d: Model.x,  # E:8 pytongue1003
) -> None: ...
