# `from . import Name` with no `Name.py` takes `Name` from the package's `__init__.py`.
from . import Token


def first(tokens: list[Token]) -> Token:
    return tokens[0]
# @filename: __init__.py
from pydantic import BaseModel


class Token(BaseModel):
    text: str
