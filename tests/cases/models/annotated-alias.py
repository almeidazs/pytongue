# `Annotated[T, Field(alias=...)]` renames the property like an assigned `Field`.
from typing import Annotated

from pydantic import BaseModel, Field


class Ticket(BaseModel):
    ticket_id: Annotated[int, Field(alias="ticketId")]
    title: Annotated[str, Field(description="Short summary")] = ""
