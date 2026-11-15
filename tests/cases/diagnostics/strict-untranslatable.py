# @strict: true
# Annotations with no TypeScript equivalent are pytongue1003.
from typing import Callable


def run(data: bytes, callback: Callable[[int], int]) -> str:  # E:15 pytongue1003 # E:32 pytongue1003
    return ""
