# PEP 695 `type X = ...` statements are type aliases.
type Pair = tuple[int, int]
type Name = str
type Maybe = Name | None


def f(p: Pair, n: Maybe) -> None: ...
