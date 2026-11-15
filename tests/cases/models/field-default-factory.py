# `Field(default_factory=...)` is a default, so the field is optional in Input.
from pydantic import BaseModel, Field


class Cart(BaseModel):
    items: list[str] = Field(default_factory=list)
    meta: dict[str, int] = Field(default_factory=dict)
