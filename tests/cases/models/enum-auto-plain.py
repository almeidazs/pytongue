# Plain `Enum` `auto()` counts from 1 like IntEnum.
import enum


class Stage(enum.Enum):
    DRAFT = enum.auto()
    REVIEW = enum.auto()
    DONE = enum.auto()
