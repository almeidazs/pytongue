# An Enum with string values is a union of those strings.
from enum import Enum


class Color(Enum):
    RED = "red"
    GREEN = "green"
    BLUE = "blue"
