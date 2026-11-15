# A positional-only parameter with a default stays an optional positional, not a kwarg.
def power(base: float, exp: float = 2.0, /) -> float:
    return base**exp
