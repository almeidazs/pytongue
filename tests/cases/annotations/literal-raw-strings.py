# Raw strings keep their backslashes.
from typing import Literal


def f(a: Literal[r"\d+", R"a\nb"], b: Literal[r"""C:\path"""]) -> None: ...
