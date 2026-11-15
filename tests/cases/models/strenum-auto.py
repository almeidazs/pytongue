# `StrEnum` with `auto()` uses the lower-cased member name as the value.
from enum import StrEnum, auto


class Method(StrEnum):
    GET = auto()
    POST = auto()
    Patch = auto()
