# Names imported under another name resolve to the original.
from datetime import datetime as DT
from typing import List as L
from typing import Optional as Maybe


def f(a: L[int], b: Maybe[DT]) -> None: ...
