# Final unwraps to its inner type; ClassVar fields are not part of the model.
from typing import ClassVar, Final

from pydantic import BaseModel


class Config(BaseModel):
    name: Final[str]
    retries: Final[int] = 3
    registry: ClassVar[dict[str, int]] = {}
