# Repeated keyword types appear once in the `**kwargs` index signature.
def limits(low: int = 0, high: int = 10, **more: int) -> None:
    pass
