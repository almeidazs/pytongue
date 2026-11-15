# `_private` attributes and `model_config` are not fields.
from pydantic import BaseModel, ConfigDict


class Secret(BaseModel):
    model_config = ConfigDict(frozen=True)
    _token: str = ""
    __cache: dict[str, str] = {}
    label: str
