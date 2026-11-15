# Annotated keeps only its first argument, whatever the metadata.
from typing import Annotated, Optional

from pydantic import Field


def f(
    a: Annotated[int, "meta"],
    b: Annotated[str, Field(min_length=1)],
    c: Annotated[Optional[int], Field(ge=0), "doc"],
    d: Annotated[Annotated[float, 1], 2],
) -> Annotated[bool, "ret"]: ...
