# @strict: true
# Bounds are not type parameters: `int` in `T: int` is still the builtin.


def g[T: int, *Ts](
    a: T,  # E pytongue1003
    b: int,
) -> int: ...
