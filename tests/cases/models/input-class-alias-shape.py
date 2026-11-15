# A class named Input whose input shape equals its output: no circular alias.
from pydantic import BaseModel


class Input(BaseModel):
    text: str


def run(value: Input) -> str:
    return value.text
