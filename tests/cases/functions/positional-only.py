# Positional-only parameters without defaults stay required positionals.
def divide(a: float, b: float, /) -> float:
    return a / b
