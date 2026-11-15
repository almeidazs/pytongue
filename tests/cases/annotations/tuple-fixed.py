# Fixed-length tuples become TypeScript tuples.
from typing import Tuple


def f(a: tuple[int, str], b: Tuple[int, str, bool], c: tuple[int]) -> tuple[str, float]: ...
