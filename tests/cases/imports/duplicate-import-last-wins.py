# Python binds the last import of a name: the written import and the export agree.
from .a import Token
from .b import Token

__all__ = ["Token"]


def f(t: Token) -> None: ...
# @filename: a.py
from pydantic import BaseModel


class Token(BaseModel):
    from_a: str
# @filename: b.py
from pydantic import BaseModel


class Token(BaseModel):
    from_b: str
