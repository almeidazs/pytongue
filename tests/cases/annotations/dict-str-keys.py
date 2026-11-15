# dict with str (or string-like) keys becomes Record<string, V>.
from typing import Any, Dict
from uuid import UUID


def f(
    a: dict[str, int],
    b: Dict[str, list[int]],
    c: dict[str, Any],
    d: dict[UUID, str],
    e: dict[str, dict[str, bool]],
) -> None: ...
