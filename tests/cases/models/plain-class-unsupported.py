# A model field typed with a plain class is `unknown`.
from pydantic import BaseModel


class Engine:
    pass


class Car(BaseModel):
    engine: Engine
    wheels: int = 4
