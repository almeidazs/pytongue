# `ReadOnly` is peeled off, and still composes with `NotRequired`.
from typing import NotRequired, ReadOnly, TypedDict


class Frozen(TypedDict):
    key: ReadOnly[str]
    note: ReadOnly[NotRequired[str]]
