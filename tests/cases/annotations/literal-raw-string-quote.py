# A raw string whose content is an escaped quote keeps its backslash.
from typing import Literal


def f(v: Literal[r"\'", r"a\"b"]) -> None: ...
