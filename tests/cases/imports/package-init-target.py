# `from .pkg import X` resolves to `pkg/__init__.py` when there is no `pkg.py`.
from .pkg import Token


def first(tokens: list[Token]) -> Token:
    return tokens[0]
# @filename: pkg/__init__.py
from pydantic import BaseModel


class Token(BaseModel):
    text: str
