# Pydantic constrained ints, floats and bools map to number and boolean.
from pydantic import (
    FiniteFloat,
    NegativeFloat,
    NegativeInt,
    NonNegativeFloat,
    NonNegativeInt,
    NonPositiveFloat,
    NonPositiveInt,
    PositiveFloat,
    PositiveInt,
    StrictBool,
    StrictFloat,
    StrictInt,
)


def f(
    a: StrictInt,
    b: PositiveInt,
    c: NegativeInt,
    d: NonNegativeInt,
    e: NonPositiveInt,
    f: StrictFloat,
    g: PositiveFloat,
    h: NegativeFloat,
    i: NonNegativeFloat,
    j: NonPositiveFloat,
    k: FiniteFloat,
    l: StrictBool,
) -> None: ...
