# `**kwargs: T` becomes an optional object with an index signature of T.
def headers(**values: str) -> dict[str, str]:
    return values
