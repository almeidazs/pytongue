# An Enum with int values is a union of those numbers.
from enum import Enum


class Level(Enum):
    LOW = 1
    MID = 5
    HIGH = 10
