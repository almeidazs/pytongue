# A member value pytongue cannot read statically makes the whole enum `unknown`.
from enum import Enum


def make() -> str:
    return "x"


class Dynamic(Enum):
    A = "a"
    B = make()
