# `from . import mod` is a namespace import; `mod.Thing` goes through its `$py$` surface.
from . import models


def first(tokens: list[models.Token]) -> models.Token:
    return tokens[0]
# @filename: models.py
from pydantic import BaseModel


class Token(BaseModel):
    text: str
