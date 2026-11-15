# `*args: T` adds an overload that takes the extra arguments as a `T[]` array.
def join(sep: str, *parts: str) -> str:
    return sep.join(parts)
