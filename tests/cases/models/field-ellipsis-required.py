# `Field(...)` (Ellipsis) marks the field required, so Input stays an alias.
from pydantic import BaseModel, Field


class Login(BaseModel):
    user: str = Field(...)
    password: str = Field(..., min_length=8)
