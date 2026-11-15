# `from . import pkg` where `pkg/__init__.py` exists is a namespace import of the package.
from . import pkg


def first(token: pkg.Token) -> str:
    return token.text
# @filename: pkg/__init__.py
from pydantic import BaseModel


class Token(BaseModel):
    text: str
