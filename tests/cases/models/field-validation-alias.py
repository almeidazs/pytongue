# `validation_alias` renames the property in Input only.
from pydantic import BaseModel, Field


class Account(BaseModel):
    user_id: int = Field(validation_alias="userId")
