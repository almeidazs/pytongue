# auto() continues from the highest value so far, not from the last one.
from enum import IntEnum, auto


class Level(IntEnum):
    A = 10
    B = auto()
    C = 3
    D = auto()
