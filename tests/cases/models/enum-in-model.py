# A model field typed with an enum refers to the enum on output and `.Input` on input.
from enum import Enum

from pydantic import BaseModel


class Status(Enum):
    OPEN = "open"
    CLOSED = "closed"


class Issue(BaseModel):
    status: Status = Status.OPEN
