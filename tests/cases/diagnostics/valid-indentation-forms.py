# should not generate diagnostics
# Every legal way to lay out blocks: one-liners, semicolons, continuations, decorators, comments.
import functools


def one(x: int) -> int: return x


def semi(x: int) -> int:
    a = 1; b = 2
    return x + a + b


@functools.cache
def decorated(
    a: int,
      b: int,
) -> int:
    # a comment at block level
    total = (a +
        b)
    if total:
        pass
    else:
        pass
    return total


class C:
    x: int

    def method(self) -> None: ...
