# @strict: true
# should not generate diagnostics
# A TypedDict with Required/NotRequired keys is clean in strict mode.
from typing import NotRequired, TypedDict


class Env(TypedDict):
    name: str
    region: NotRequired[str]
