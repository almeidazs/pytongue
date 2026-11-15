"""Checks on values before they cross into JavaScript."""

from typing import cast

#: The largest integer JavaScript represents exactly (``Number.MAX_SAFE_INTEGER``).
MAX_SAFE_INT = 2**53 - 1


def check_safe_ints(value: object) -> None:
    """Rejects integers JavaScript cannot represent exactly, anywhere inside a JSON value.

    Args:
        value: A JSON-compatible value (dicts, lists, scalars).

    Raises:
        OverflowError: When an integer is outside ±(2^53−1).
    """
    if isinstance(value, bool):
        return

    if isinstance(value, int):
        if abs(value) > MAX_SAFE_INT:
            raise OverflowError(
                f"int {value} exceeds the JavaScript safe integer range ±(2^53−1)"
            )

        return

    if isinstance(value, dict):
        for item in cast(dict[str, object], value).values():
            check_safe_ints(item)

        return

    if isinstance(value, (list, tuple)):
        for item in cast(list[object], value):
            check_safe_ints(item)
