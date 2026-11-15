# `Field(alias=...)` renames the property on both output and Input.
from pydantic import BaseModel, Field


class Event(BaseModel):
    kind: str = Field(alias="type")
    starts: str = Field(alias="startsAt")
