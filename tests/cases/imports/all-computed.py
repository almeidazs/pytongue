# A computed `__all__` falls back to the public-name rule, with a module note.
__all__ = [name for name in ("double",)]


def double(x: float) -> float:
    return x * 2


def triple(x: float) -> float:
    return x * 3
