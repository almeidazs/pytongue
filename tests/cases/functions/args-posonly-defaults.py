# With `*args`, the rest overload must pass every optional positional before the array.
def emit(event: str, level: int = 0, /, *payload: str) -> None:
    pass
