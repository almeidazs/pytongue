# @strict: true
# should not generate diagnostics
# Nested, self-referencing and inherited models are clean in strict mode.
from pydantic import BaseModel


class Node(BaseModel):
    children: list["Node"] = []


class Leaf(Node):
    value: int
