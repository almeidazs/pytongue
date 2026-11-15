# A nested model forces a full Input that refers to the nested `.Input`.
from pydantic import BaseModel


class Address(BaseModel):
    city: str


class Person(BaseModel):
    name: str
    address: Address
