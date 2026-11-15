# A Literal alias used inside Literal contributes its values.
from typing import Literal

Mode = Literal["r", "w"]


def f(m: Literal[Mode, "a"]) -> None: ...
