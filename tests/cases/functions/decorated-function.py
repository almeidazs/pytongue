# A decorated function is declared from the def under its decorators.
import functools


@functools.cache
def fib(n: int) -> int:
    return n if n < 2 else fib(n - 1) + fib(n - 2)
