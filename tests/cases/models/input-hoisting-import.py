# An import named `Input` also hoists input shapes out of the namespace.
from pydantic import BaseModel

from .forms import Input


class Wrapper(BaseModel):
    payload: Input
    retries: int = 0
# @filename: forms.py
from pydantic import BaseModel


class Input(BaseModel):
    value: str
    strict: bool = False
