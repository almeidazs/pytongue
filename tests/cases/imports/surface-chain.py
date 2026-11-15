# A name imported through a module that itself imports it follows the `$py$` chain.
from .b import Token


def first(tokens: list[Token]) -> Token:
    return tokens[0]
# @filename: b.py
from .c import Token
# @filename: c.py
from pydantic import BaseModel


class Token(BaseModel):
    text: str
