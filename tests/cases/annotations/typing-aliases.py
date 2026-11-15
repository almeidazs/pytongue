# Deprecated typing aliases are folded onto their builtin.
from typing import DefaultDict, Deque, Dict, FrozenSet, List, OrderedDict, Set, Text, Tuple


def f(
    a: List[int],
    b: Dict[str, int],
    c: Set[str],
    d: FrozenSet[float],
    e: Tuple[int, str],
    f: Text,
    g: DefaultDict[str, int],
    h: OrderedDict[str, bool],
    i: Deque[str],
) -> None: ...
