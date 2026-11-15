# A relative module listed in `__all__` is re-exported with `export * as`.
from . import models

__all__ = ["models"]
# @filename: models.py
from pydantic import BaseModel


class Token(BaseModel):
    text: str
