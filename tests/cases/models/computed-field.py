# `@computed_field` properties are output-only: present on the interface, absent from Input.
from pydantic import BaseModel, computed_field


class Rect(BaseModel):
    width: float
    height: float

    @computed_field
    @property
    def area(self) -> float:
        """Width times height."""
        return self.width * self.height
