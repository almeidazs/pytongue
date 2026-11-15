# `total=False` makes every key optional on output and Input alike.
from typing import TypedDict


class Options(TypedDict, total=False):
    verbose: bool
    depth: int
