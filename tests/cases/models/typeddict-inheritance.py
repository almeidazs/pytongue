# TypedDict inheritance keeps each class's own `total=` and mirrors `extends`.
from typing import TypedDict


class Base(TypedDict):
    id: int


class Extra(Base, total=False):
    label: str
