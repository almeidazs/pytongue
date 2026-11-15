# A generator annotated with a non-iterator type yields unknown.
def items() -> list[int]:
    yield 1
