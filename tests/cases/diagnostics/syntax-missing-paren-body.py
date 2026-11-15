# A missing `)` in a body is reported where the broken statement starts; earlier code is kept.
def ok(x: int) -> int:
    return x


def clamp(x: int) -> int:
    return max(x, 0  # E:5 pytongue1001
