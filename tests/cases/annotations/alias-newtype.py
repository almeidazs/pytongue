# NewType resolves to its supertype.
from typing import NewType
from uuid import UUID

UserId = NewType("UserId", int)
Token = NewType("Token", UUID)


def f(u: UserId, t: Token) -> UserId: ...
