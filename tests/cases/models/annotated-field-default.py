# A default inside Annotated[..., Field(...)] makes the field optional on input.
from typing import Annotated

from pydantic import BaseModel, Field


class M(BaseModel):
    a: Annotated[list[int], Field(default_factory=list)]
    b: Annotated[int, Field(default=3)]
    c: Annotated[int, Field(default=...)]
    d: Annotated[int, Field(description="no default")]
