# A plain class in `__all__` is not exported, with a module note.
__all__ = ["Plain", "double"]


class Plain:
    pass


def double(x: float) -> float:
    return x * 2
