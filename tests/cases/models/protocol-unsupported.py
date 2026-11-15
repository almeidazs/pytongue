# A Protocol is not translated: references to it are `unknown`.
from typing import Protocol


class Greeter(Protocol):
    def greet(self) -> str: ...


def run(g: Greeter) -> str:
    return g.greet()
