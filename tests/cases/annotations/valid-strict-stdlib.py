# Strict: standard-library and Pydantic string and number types translate without diagnostics.
# @strict: true
# should not generate diagnostics
from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import EmailStr, PositiveInt


def f(a: datetime, b: UUID, c: Decimal, d: EmailStr, e: PositiveInt) -> None: ...
