# `import a.b` binds `a`, and `a.b.Name` resolves to the qualified name.
import collections.abc


def total(values: collections.abc.Sequence[float]) -> float:
    return sum(values)
