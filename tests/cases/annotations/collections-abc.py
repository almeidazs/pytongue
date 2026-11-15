# collections.abc names resolve like their typing counterparts.
import collections.abc
from collections.abc import Collection, Iterable, Mapping, MutableSet, Reversible, Sequence


def f(
    a: Sequence[int],
    b: Mapping[str, int],
    c: Iterable[str],
    d: MutableSet[float],
    e: Collection[bool],
    f: Reversible[int],
    g: collections.abc.MutableMapping[str, str],
) -> None: ...
