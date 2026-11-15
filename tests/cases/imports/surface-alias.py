# A type alias from another file is imported through its `$py$` surface.
from .types import Ids


def count(ids: Ids) -> int:
    return len(ids)
# @filename: types.py
Ids = list[int]
