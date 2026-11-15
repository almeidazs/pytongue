# Strict: TypeVar, ParamSpec and TypeVarTuple names are not supported yet.
# @strict: true
from typing import ParamSpec, TypeVar, TypeVarTuple

T = TypeVar("T", bound=int)
P = ParamSpec("P")
Ts = TypeVarTuple("Ts")


def f(
    x: T,  # E:8 pytongue1003
    p: P,  # E:8 pytongue1003
    ts: Ts,  # E:9 pytongue1003
) -> T: ...  # E:6 pytongue1003
