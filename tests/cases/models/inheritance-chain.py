# A local chain A <- B <- C is mirrored as `extends` on both output and Input.
from pydantic import BaseModel


class Base(BaseModel):
    id: int


class Named(Base):
    name: str


class Tagged(Named):
    tags: list[str] = []
