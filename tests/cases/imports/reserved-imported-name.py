# A class with a reserved TypeScript name is imported and re-exported under its escaped local.
from .models import string

__all__ = ["string"]
# @filename: models.py
from pydantic import BaseModel


class string(BaseModel):
    text: str
