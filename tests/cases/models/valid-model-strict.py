# @strict: true
# should not generate diagnostics
# A fully annotated model with defaults, aliases and a computed field is clean in strict mode.
from pydantic import BaseModel, Field, computed_field


class Invoice(BaseModel):
    number: str = Field(alias="invoiceNumber")
    lines: list[float] = Field(default_factory=list)
    paid: bool = False

    @computed_field
    @property
    def total(self) -> float:
        return sum(self.lines)
