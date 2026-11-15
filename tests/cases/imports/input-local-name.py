# An import named `Input` hoists `.Input` shapes so it is not shadowed.
from pydantic import BaseModel

from .models import Token as Input


class Wrapper(BaseModel):
    token: Input
# @filename: models.py
from pydantic import BaseModel


class Token(BaseModel):
    text: str
