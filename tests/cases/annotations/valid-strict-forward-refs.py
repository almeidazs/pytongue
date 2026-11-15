# Strict: forward references to later classes translate without diagnostics.
# @strict: true
# should not generate diagnostics
from pydantic import BaseModel


def f(a: "Node", b: list["Node"], c: "Node | None") -> "list[Node]": ...


class Node(BaseModel):
    children: list["Node"] = []
