# The `$py$` surface lists every class: translated ones by name, others as `$Unknown`.
from enum import Enum

from pydantic import BaseModel


class Mode(Enum):
    ON = "on"
    OFF = "off"


class Helper:
    pass


class Config(BaseModel):
    mode: Mode
