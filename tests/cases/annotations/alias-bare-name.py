# A name bound to a type is an alias: a builtin, a model, a stdlib type.
import datetime

from pydantic import BaseModel


class Row(BaseModel):
    id: int


MyInt = int
RowAlias = Row
When = datetime.date


def f(a: MyInt, b: RowAlias, c: When) -> MyInt: ...
