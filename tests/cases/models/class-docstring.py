# A class docstring becomes the interface's JSDoc.
from pydantic import BaseModel


class Color(BaseModel):
    """An RGB color.

    Channels go from 0 to 255.
    """

    r: int
    g: int
    b: int
