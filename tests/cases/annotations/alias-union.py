# A module-level `X = A | B` or `X = Optional[A]` is a type alias.
from typing import Optional

Id = int | str
MaybeName = Optional[str]


def f(i: Id, n: MaybeName) -> None: ...
