# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
from .helpers import double

__all__ = ["quadruple", "double"]


def quadruple(x: int) -> int:
    return double(double(x))


def where() -> str:
    return __name__
