# `import a.b as c` binds `c` to the module `a.b`.
import collections.abc as cabc


def count(values: cabc.Mapping[str, int]) -> int:
    return len(values)
