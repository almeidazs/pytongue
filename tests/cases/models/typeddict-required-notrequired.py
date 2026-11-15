# `Required` and `NotRequired` override the class's `total=` per key.
from typing import NotRequired, Required, TypedDict


class Draft(TypedDict):
    title: str
    subtitle: NotRequired[str]


class Patch(TypedDict, total=False):
    id: Required[int]
    title: str
