# @strict: true
# A PEP 695 generic model's type parameter is a generic field type.
from pydantic import BaseModel


class Box[T](BaseModel):
    item: T  # E pytongue1003
    count: int
