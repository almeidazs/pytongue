# `__all__ +=` makes `__all__` dynamic: the public-name rule applies, with a module note.
__all__ = ["double"]
__all__ += ["triple"]


def double(x: float) -> float:
    return x * 2


def triple(x: float) -> float:
    return x * 3


def _hidden(x: float) -> float:
    return x
