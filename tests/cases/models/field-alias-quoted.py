# An alias that is not a TS identifier is written as a quoted property.
from pydantic import BaseModel, Field


class Header(BaseModel):
    content_type: str = Field(alias="content-type")
