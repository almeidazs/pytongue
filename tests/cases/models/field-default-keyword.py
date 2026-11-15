# `Field(default=value)` is a default; `Field(default=...)` is required.
from pydantic import BaseModel, Field


class Settings(BaseModel):
    retries: int = Field(default=3)
    host: str = Field(default=...)
