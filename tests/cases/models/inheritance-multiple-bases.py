# A model with two model bases extends both, on output and Input.
from pydantic import BaseModel


class Timestamps(BaseModel):
    created: str


class Owned(BaseModel):
    owner: str


class Doc(Timestamps, Owned):
    body: str
