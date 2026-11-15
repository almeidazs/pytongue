# Literal ints in hex, octal, binary and with underscores become numbers.
from typing import Literal


def f(a: Literal[0, 42], b: Literal[0x1F, 0o17, 0b101], c: Literal[1_000_000]) -> None: ...
