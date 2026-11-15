# @strict: true
# In strict mode, a reference to an unsupported class is an error where it is used.
from dataclasses import dataclass

from pydantic import BaseModel


@dataclass
class Money:
    cents: int


class Invoice(BaseModel):
    total: Money  # E:12 pytongue1003


def pay(m: Money) -> None:  # E:12 pytongue1003
    pass
