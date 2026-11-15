# Strict: a self-referential alias is cut at its first recursive reference and reported there.
# @strict: true
type Nested = list[Nested]  # E:20 pytongue1003


def f(x: Nested) -> None: ...
