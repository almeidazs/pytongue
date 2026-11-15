# String annotations are parsed as types.
from typing import Optional

from pydantic import BaseModel


def f(a: "int", b: "list[str]", c: "Optional[int]", d: "Item", e: 'dict[str, float]') -> "Item": ...


class Item(BaseModel):
    name: str
