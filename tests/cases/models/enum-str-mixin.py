# A `str, Enum` mixin is still an enum of its member values.
from enum import Enum


class Size(str, Enum):
    SMALL = "s"
    LARGE = "l"


class Code(int, Enum):
    OK = 200
    MISSING = 404
