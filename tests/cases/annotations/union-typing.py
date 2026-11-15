# Union flattens nested unions and drops duplicate members.
from typing import Optional, Union


def f(
    a: Union[int, str],
    b: Union[int],
    c: Union[int, Union[str, bool]],
    d: Union[str, str, None],
    e: Union[Optional[int], None],
) -> None: ...
