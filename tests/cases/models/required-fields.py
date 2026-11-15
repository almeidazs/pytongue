# Required fields only: the output interface doubles as the input (Input is an alias).
from pydantic import BaseModel


class User(BaseModel):
    name: str
    age: int
    score: float
    active: bool
