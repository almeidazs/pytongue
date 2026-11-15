# @strict: true
# PEP 695 type parameters are generics (1003), not unresolved names (1005).


def g[T](
    x: T,  # E pytongue1003
) -> T:  # E pytongue1003
    ...
