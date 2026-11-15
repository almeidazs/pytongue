# String-like types reached through `import module` resolve too.
import datetime
import decimal
import pathlib
import typing
import uuid


def f(a: datetime.datetime, b: uuid.UUID, c: decimal.Decimal, d: pathlib.Path, e: typing.LiteralString) -> None: ...
