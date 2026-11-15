# Without `__all__`, an underscore class is not exported but stays on the surface.
from pydantic import BaseModel


class _Draft(BaseModel):
    text: str


class Final(BaseModel):
    draft: _Draft
