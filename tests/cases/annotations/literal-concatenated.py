# Implicitly concatenated strings form one Literal value.
from typing import Literal


def f(a: Literal["ab" "cd", "x" r"\y"]) -> None: ...
