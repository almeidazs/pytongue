# @strict: true
# In strict mode an unreadable enum value is an error on the class name.
from enum import Enum


class Dynamic(Enum):  # E:7 pytongue1003
    A = "a"
    B = "b".upper()
