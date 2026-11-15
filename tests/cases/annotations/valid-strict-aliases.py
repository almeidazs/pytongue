# Strict: every alias form translates without diagnostics.
# @strict: true
# should not generate diagnostics
from typing import Literal, NewType, TypeAlias

Mode = Literal["r", "w"]
Ids: TypeAlias = list[int]
UserId = NewType("UserId", int)
type Pair = tuple[str, str]
MaybeMode = Mode | None


def f(a: Mode, b: Ids, c: UserId, d: Pair, e: MaybeMode) -> None: ...
