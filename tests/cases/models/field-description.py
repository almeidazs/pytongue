# `Field(description=...)` becomes the property's JSDoc on output and Input.
from pydantic import BaseModel, Field


class Product(BaseModel):
    sku: str = Field(description="Stock keeping unit")
    price: float = Field(0.0, description="Unit price in USD")
