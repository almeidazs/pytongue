# Mapping and MutableMapping behave like dict.
from typing import Mapping, MutableMapping


def f(a: Mapping[str, int], b: MutableMapping[str, float], c: Mapping) -> Mapping[str, str]: ...
