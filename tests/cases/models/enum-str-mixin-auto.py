# class E(str, Enum): auto() is converted with str(), so the values are "1", "2".
from enum import Enum, auto


class Name(str, Enum):
    FIRST = auto()
    SECOND = auto()
