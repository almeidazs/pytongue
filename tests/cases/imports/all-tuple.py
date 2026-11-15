# A literal `__all__` tuple works like a list.
__all__ = ("double",)


def double(x: float) -> float:
    return x * 2


def triple(x: float) -> float:
    return x * 3
