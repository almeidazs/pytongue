# A model may refer to itself through a forward reference.
from pydantic import BaseModel


class TreeNode(BaseModel):
    value: int
    children: list["TreeNode"] = []
    parent: "TreeNode | None" = None
