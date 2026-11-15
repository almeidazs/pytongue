# Aliases that refer to other aliases expand transitively.
from typing import TypeAlias

Ints = list[int]
MaybeInts = Ints | None
Final_: TypeAlias = MaybeInts


def f(a: Final_) -> None: ...
