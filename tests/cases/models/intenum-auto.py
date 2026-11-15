# `IntEnum` `auto()` counts from 1, and continues after an explicit value.
from enum import IntEnum, auto


class Priority(IntEnum):
    LOW = auto()
    MID = auto()
    URGENT = 10
    CRITICAL = auto()
