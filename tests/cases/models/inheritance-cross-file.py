# A base model imported from another file is extended through its `$py$` surface.
from .base import Entity


class Customer(Entity):
    email: str
# @filename: base.py
from pydantic import BaseModel


class Entity(BaseModel):
    id: int
    version: int = 1
