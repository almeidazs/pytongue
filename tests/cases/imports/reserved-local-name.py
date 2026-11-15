# A reserved TypeScript name as an import local is escaped with `$`.
from .models import Token as default


def first(tokens: list[default]) -> default:
    return tokens[0]
# @filename: models.py
from pydantic import BaseModel


class Token(BaseModel):
    text: str
