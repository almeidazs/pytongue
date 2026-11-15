# A name the package's __init__.py defines wins over a submodule of the same name.
from .pkg import sub

__all__ = ["sub"]
# @filename: pkg/__init__.py
from pydantic import BaseModel


class sub(BaseModel):
    from_init: int
# @filename: pkg/sub.py
SUBMODULE = True
