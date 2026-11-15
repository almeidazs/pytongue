# Literal strings decode quotes and escape sequences.
from typing import Literal


def f(
    a: Literal["plain", 'single'],
    b: Literal["say \"hi\"", 'it\'s'],
    c: Literal["tab\there", "line\nbreak", "back\\slash"],
    d: Literal["\x41", "\u00e9", "\102"],
    e: Literal["""triple"""],
) -> None: ...
