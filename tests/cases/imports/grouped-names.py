# Several names from one module share a single `import type { ... }`.
from .models import Token, Span


def locate(token: Token) -> Span:
    return Span(start=0, end=len(token.text))
# @filename: models.py
from pydantic import BaseModel


class Token(BaseModel):
    text: str


class Span(BaseModel):
    start: int
    end: int
