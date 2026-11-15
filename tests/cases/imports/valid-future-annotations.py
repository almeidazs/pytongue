# @strict: true
# should not generate diagnostics
# `from __future__ import annotations` has no effect on the types.
from __future__ import annotations


def scale(value: float, factor: int) -> float:
    return value * factor
