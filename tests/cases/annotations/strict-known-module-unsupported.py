# Strict: names from known modules without a JSON mapping are untranslatable.
# @strict: true
import enum
import re
from collections import Counter
from typing import NoReturn


def f(
    a: re.Pattern,  # E:8 pytongue1003
    b: enum.Enum,  # E:8 pytongue1003
    c: re.Match[str],  # E:8 pytongue1003
    d: Counter[str],  # E:8 pytongue1003
) -> NoReturn: ...  # E:6 pytongue1003
