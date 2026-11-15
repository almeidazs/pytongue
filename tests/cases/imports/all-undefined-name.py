# A name in `__all__` that is not defined is skipped, with a module note.
__all__ = ["double", "ghost"]


def double(x: float) -> float:
    return x * 2
