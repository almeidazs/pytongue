# String annotations nest inside subscripts and inside other strings.
from typing import Optional

from pydantic import BaseModel


def f(a: list["Item"], b: Optional["int"], c: "list['Item']") -> None: ...


class Item(BaseModel):
    name: str
