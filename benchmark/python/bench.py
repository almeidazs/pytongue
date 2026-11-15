"""The functions every tool in the benchmark calls.

pytongue imports this file directly, pythonia and pymport load it as a module, and the
hand-written workers, the FastAPI app and the native timing script all expose the same three
functions with the same semantics.
"""

from typing import Any


def add(a: int, b: int) -> int:
    """Adds two integers: the smallest possible call."""
    return a + b


def echo(payload: dict[str, Any]) -> dict[str, Any]:
    """Returns its argument unchanged: measures how payload size scales."""
    return payload


def cpu(n: int) -> int:
    """Sums the squares below `n` in a pure-Python loop: measures raw interpreter speed."""
    total = 0

    for i in range(n):
        total += i * i

    return total % 1_000_000_007
