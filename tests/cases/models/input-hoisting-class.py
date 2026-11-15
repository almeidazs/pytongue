# A class named `Input` hoists every input shape to `$Input$X`, so it is not shadowed.
from pydantic import BaseModel


class Input(BaseModel):
    text: str
    lang: str = "en"


class Job(BaseModel):
    source: Input
    priority: int = 0
