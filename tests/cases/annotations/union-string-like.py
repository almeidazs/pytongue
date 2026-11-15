# Union members that all map to string collapse into one.
from datetime import date
from uuid import UUID


def f(a: str | UUID, b: date | str | None) -> None: ...
