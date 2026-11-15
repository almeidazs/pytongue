# `X | None` without a default stays required: nullable is not optional.
from pydantic import BaseModel


class Profile(BaseModel):
    bio: str | None
    nickname: str | None = None
