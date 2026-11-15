# Underscore names in an enum body are not members.
from enum import Enum


class Shape(Enum):
    _ignore_ = ["helper"]
    _hidden = 0
    CIRCLE = "circle"
    SQUARE = "square"
