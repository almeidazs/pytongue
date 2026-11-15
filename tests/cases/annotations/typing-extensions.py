# typing_extensions names resolve like their typing counterparts.
import typing_extensions
from typing_extensions import Annotated, Literal, LiteralString, Optional


def f(
    a: Literal["x", "y"],
    b: Annotated[int, "meta"],
    c: LiteralString,
    d: Optional[str],
    e: typing_extensions.List[int],
) -> None: ...
