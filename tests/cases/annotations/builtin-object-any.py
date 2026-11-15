# `object` and `typing.Any` both become unknown, without a reason.
from typing import Any


def f(o: object, a: Any) -> Any: ...
