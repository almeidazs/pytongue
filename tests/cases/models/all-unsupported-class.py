# A non-translated class listed in `__all__` is not exported, with a module note.
from dataclasses import dataclass

from pydantic import BaseModel

__all__ = ["Row", "Model"]


@dataclass
class Row:
    id: int


class Model(BaseModel):
    id: int
