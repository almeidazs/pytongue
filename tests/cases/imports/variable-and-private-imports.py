# Names another file does not export to .py files (variables, private functions) import nothing.
from .consts import LIMIT, _hidden


def f(x: int) -> int:
    return x
# @filename: consts.py
LIMIT = 3


def _hidden() -> int:
    return LIMIT
