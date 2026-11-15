# @strict: true
# \N{name} needs a Unicode name table, so the literal is unknown rather than wrong.
from typing import Literal


def f(v: Literal["\N{BULLET}"]) -> None:  # E pytongue1003
    ...
