# A class named after a TS keyword (`delete`) is escaped locally and exported by its name.
from pydantic import BaseModel


class delete(BaseModel):
    target: str
    force: bool = False
