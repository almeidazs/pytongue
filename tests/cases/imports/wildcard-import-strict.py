# @strict: true
# `from .x import *` binds nothing, so names it would bring in are unresolved.
from .models import *


def first(token: Token) -> str:  # E:18 pytongue1005
    return token.text
# @filename: models.py
from pydantic import BaseModel


class Token(BaseModel):
    text: str
