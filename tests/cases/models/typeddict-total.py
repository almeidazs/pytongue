# A total TypedDict has every key required, so Input is an alias.
from typing import TypedDict


class Movie(TypedDict):
    title: str
    year: int
