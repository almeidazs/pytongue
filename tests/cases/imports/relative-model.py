from .models import Token


def first(tokens: list[Token]) -> Token:
    return tokens[0]
# @filename: models.py
from pydantic import BaseModel


class Token(BaseModel):
    text: str
    pos: str | None = None
