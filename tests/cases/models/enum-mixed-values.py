# Float, bool and negative member values become their literals.
from enum import Enum


class Odd(Enum):
    HALF = 0.5
    YES = True
    BELOW = -3
