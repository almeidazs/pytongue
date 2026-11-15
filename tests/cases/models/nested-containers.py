# Models inside lists, dicts and unions are referenced through `.Input` on input.
from pydantic import BaseModel


class Tag(BaseModel):
    label: str


class Post(BaseModel):
    tags: list[Tag]
    by_name: dict[str, Tag]
    pinned: Tag | None = None
