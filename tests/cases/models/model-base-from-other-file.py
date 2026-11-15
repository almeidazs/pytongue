# A model subclass of a model from another file stays a model (defaults optional on input).
from pydantic import BaseModel

from .base import Base


class Child(Base):
    extra: int = 0
# @filename: base.py
from pydantic import BaseModel


class Base(BaseModel):
    id: int = 0
