# A module variable in `__all__` is not exported, with a module note.
__all__ = ["LIMIT", "double"]

LIMIT = 10


def double(x: float) -> float:
    return x * 2
