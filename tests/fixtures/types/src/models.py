import datetime
from enum import StrEnum
from typing import Annotated, NotRequired, TypedDict

from pydantic import BaseModel, Field

Score = Annotated[float, Field(ge=0, le=1)]


class _Stamp(BaseModel):
    """Private to this module in spirit, but importable from Python and so from other .py files."""

    created: datetime.datetime


class Lang(StrEnum):
    """Languages the classifier understands."""

    PT = "pt"
    EN = "en"


class Token(BaseModel):
    text: str
    pos: str | None = None
    """Part-of-speech tag, when known."""


class Span(TypedDict):
    start: int
    end: int
    label: NotRequired[str]


class Annotated_(BaseModel):
    token: Token
    weight: float = Field(default=1.0, alias="w")
