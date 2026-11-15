# `serialization_alias` renames the property in the output only.
from pydantic import BaseModel, Field


class Account(BaseModel):
    user_id: int = Field(serialization_alias="userId")
