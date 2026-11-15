# A string right after a field is its docstring, written as JSDoc on both shapes.
from pydantic import BaseModel


class Point(BaseModel):
    x: float
    """Horizontal position."""
    y: float = 0.0
    """Vertical position.

    Defaults to the baseline.
    """
