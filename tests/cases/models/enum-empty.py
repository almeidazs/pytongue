# An enum without members is plain `unknown`.
from enum import Enum


class Nothing(Enum):
    pass
