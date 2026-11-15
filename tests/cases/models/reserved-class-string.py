# A class named after a TS reserved type name is escaped locally and exported by its name.
from pydantic import BaseModel


class string(BaseModel):
    value: str


def echo(s: string) -> string:
    return s
