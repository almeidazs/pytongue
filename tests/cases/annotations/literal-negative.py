# Signed Literal numbers keep their sign.
from typing import Literal


def f(a: Literal[-1, -0x10], b: Literal[+3], c: Literal[-1, 0, 1]) -> None: ...
