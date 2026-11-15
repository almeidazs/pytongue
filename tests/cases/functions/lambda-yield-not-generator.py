# A yield inside a lambda does not make the enclosing function a generator.
def make() -> int:
    f = lambda: (yield)
    return 1
