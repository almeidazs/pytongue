# Flag and IntFlag auto() count powers of two, above the highest value so far.
from enum import Flag, IntFlag, auto


class Perm(Flag):
    READ = auto()
    WRITE = auto()
    EXEC = auto()


class Mode(IntFlag):
    BASE = 4
    NEXT = auto()
    AFTER = auto()
