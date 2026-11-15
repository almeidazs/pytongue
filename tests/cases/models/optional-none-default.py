# `Optional[X] = None` is nullable in the output and optional in Input.
from typing import Optional

from pydantic import BaseModel


class Query(BaseModel):
    term: str
    limit: Optional[int] = None
