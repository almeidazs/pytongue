# Strict: a name imported from a missing relative module is unresolved.
# @strict: true
from .nowhere import Thing


def f(t: Thing) -> None: ...  # E:10 pytongue1005
