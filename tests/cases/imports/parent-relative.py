# `from ..x import Y` in a nested file resolves against the parent directory.
from .sub.child import Wrapper


def unwrap(w: Wrapper) -> str:
    return w.token.text
# @filename: models.py
from pydantic import BaseModel


class Token(BaseModel):
    text: str
# @filename: sub/__init__.py
# @filename: sub/child.py
from pydantic import BaseModel

from ..models import Token


class Wrapper(BaseModel):
    token: Token
