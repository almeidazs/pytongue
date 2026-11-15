# `from .x import Y as Z` maps both the imported and the local name.
from .models import Token as Tok


def first(tokens: list[Tok]) -> Tok:
    return tokens[0]
# @filename: models.py
from pydantic import BaseModel


class Token(BaseModel):
    text: str
