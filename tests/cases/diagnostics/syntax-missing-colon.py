# A missing `:` inside a body is reported on that statement only.
def ok(x: int) -> int:
    if x  # E:5 pytongue1001
        return x
    return 0


def after(y: str) -> str:
    return y
