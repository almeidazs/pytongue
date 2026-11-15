# A local model is `M.Input` as a parameter and `M` as a result.
from pydantic import BaseModel


class User(BaseModel):
    name: str


def save(user: User, *, notify: User | None = None) -> User:
    return user
