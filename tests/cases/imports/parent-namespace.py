# `from .. import mod` in a nested file is a namespace import of the parent's module.
from .sub.child import Holder


def unwrap(holder: Holder) -> str:
    return holder.token.text
# @filename: models.py
from pydantic import BaseModel


class Token(BaseModel):
    text: str
# @filename: sub/__init__.py
# @filename: sub/child.py
from pydantic import BaseModel

from .. import models


class Holder(BaseModel):
    token: models.Token
