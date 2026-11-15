# Imports inside `try:` / `except ImportError:` bind names; the first import of a local wins.
try:
    from .fast import Token
except ImportError:
    from .slow import Token


def first(tokens: list[Token]) -> Token:
    return tokens[0]
# @filename: fast.py
from pydantic import BaseModel


class Token(BaseModel):
    text: str
# @filename: slow.py
from pydantic import BaseModel


class Token(BaseModel):
    text: str
