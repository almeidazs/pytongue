# Annotated attributes in an enum body are not members.
from enum import Enum


class Unit(Enum):
    label: str = "unit"
    METER = "m"
    INCH = "in"
