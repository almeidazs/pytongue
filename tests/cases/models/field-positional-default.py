# `Field(value)` with a positional default makes the field optional in Input.
from pydantic import BaseModel, Field


class Page(BaseModel):
    size: int = Field(20)
    title: str = Field("untitled", description="Page title")
