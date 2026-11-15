# A type alias goes on the `$py$` surface with its own output and Input forms.
from pydantic import BaseModel


class Item(BaseModel):
    name: str


Items = list[Item]
MaybeItem = Item | None
