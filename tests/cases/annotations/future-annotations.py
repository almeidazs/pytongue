# With `from __future__ import annotations`, later classes can be named without quotes.
from __future__ import annotations

from pydantic import BaseModel


def f(item: Item) -> list[Item]: ...


class Item(BaseModel):
    parent: Item | None = None
