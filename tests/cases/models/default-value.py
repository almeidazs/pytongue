# A field with `= value` is optional in Input only, never in the output interface.
from pydantic import BaseModel


class Item(BaseModel):
    name: str
    qty: int = 1
    tags: list[str] = []
