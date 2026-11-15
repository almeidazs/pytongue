from pydantic import BaseModel


class Item(BaseModel):
    name: str
    price: float
    quantity: int = 1


class Invoice(BaseModel):
    items: list[Item]
    subtotal: float
    total: float


def checkout(items: list[Item], *, discount: float = 0) -> Invoice:
    """Prices a cart, applying an optional discount."""
    subtotal = sum(item.price * item.quantity for item in items)
    total = round(subtotal * (1 - discount), 2)

    return Invoice(items=items, subtotal=subtotal, total=total)
