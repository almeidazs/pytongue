# @strict: true
# should not generate diagnostics
# Literal and auto() enum members are clean in strict mode.
from enum import Enum, StrEnum, auto


class Tier(Enum):
    FREE = 0
    PRO = 1


class Region(StrEnum):
    EU = auto()
    US = auto()
