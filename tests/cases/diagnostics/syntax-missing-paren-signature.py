# A missing `)` in a signature drops that function; the rest of the file is still emitted.
def ok(x: int) -> int:
    return x


def broken(x: int, y: str -> str:  # E:1 pytongue1001
    return y
