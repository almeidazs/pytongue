# Default, alias and description in one `Field(...)` call.
from pydantic import BaseModel, Field


class Order(BaseModel):
    order_id: str = Field(..., alias="orderId", description="Public id")
    note: str | None = Field(default=None, alias="customerNote", description="Free text")
