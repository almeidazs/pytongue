# collections.deque, defaultdict and OrderedDict map like list and dict.
import collections
from collections import OrderedDict, defaultdict, deque


def f(
    a: deque[int],
    b: defaultdict[str, int],
    c: OrderedDict[str, float],
    d: collections.deque[str],
) -> None: ...
