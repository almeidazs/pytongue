# Imports inside `if TYPE_CHECKING:` still bind names for annotations.
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .models import Token


def first(tokens: "list[Token]") -> "Token":
    return tokens[0]
# @filename: models.py
from pydantic import BaseModel


class Token(BaseModel):
    text: str
