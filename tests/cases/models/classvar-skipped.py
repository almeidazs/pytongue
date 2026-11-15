# `ClassVar` attributes are not fields and do not appear in the types.
from typing import ClassVar

from pydantic import BaseModel


class Counter(BaseModel):
    registry: ClassVar[dict[str, int]] = {}
    limit: ClassVar[int]
    value: int
