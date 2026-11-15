# `Flag` and `IntFlag` with explicit values are unions of those numbers.
from enum import Flag, IntFlag


class Perm(Flag):
    READ = 1
    WRITE = 2
    EXEC = 4


class Bits(IntFlag):
    LOW = 1
    HIGH = 128
