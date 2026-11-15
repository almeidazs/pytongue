# A relative class listed in `__all__` is re-exported as a type through `$py$`.
from .models import Token

__all__ = ["Token"]
# @filename: models.py
from pydantic import BaseModel


class Token(BaseModel):
    text: str
