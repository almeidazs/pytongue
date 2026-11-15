# A NamedTuple is not translated: references to it are `unknown`.
from typing import NamedTuple


class Pair(NamedTuple):
    left: int
    right: int


def swap(p: Pair) -> Pair:
    return Pair(p.right, p.left)
