# @strict: true
# `from . import name` with neither `name.py` nor an `__init__.py` is unresolved.
from . import ghost


def use(value: ghost) -> str:  # E:16 pytongue1005
    return ""
