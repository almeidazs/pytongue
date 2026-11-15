# @strict: true
# `mod.a.B` through a namespace import cannot be resolved.
from . import models


def first(token: models.inner.Token) -> str:  # E:18 pytongue1005
    return ""
# @filename: models.py
from pydantic import BaseModel


class Token(BaseModel):
    text: str
