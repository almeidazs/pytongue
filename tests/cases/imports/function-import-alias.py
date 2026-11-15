# An aliased function import re-exports under the alias.
from .impl import helper as h

__all__ = ["h"]
# @filename: impl.py
def helper(x: int) -> int:
    return x
