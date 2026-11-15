# Strict: builtin scalars and containers translate without diagnostics.
# @strict: true
# should not generate diagnostics
from typing import Any, Literal, Optional


def f(
    a: str,
    b: int,
    c: float | None,
    d: list[bool],
    e: dict[str, Any],
    f: tuple[int, str],
    g: Optional[Literal["x", "y"]],
) -> list[str]: ...
