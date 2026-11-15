# A yield inside a nested def does not make the outer function a generator.
def outer() -> int:
    def inner():
        yield 1

    return 0
