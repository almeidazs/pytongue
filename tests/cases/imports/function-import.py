# Importing a function from another file brings no type error, and __all__ can re-export it.
from .impl import helper

__all__ = ["helper"]
# @filename: impl.py
def helper(x: int) -> int:
    return x
