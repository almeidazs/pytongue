# Defaults before `/` stay optional positionals; defaults after it go into kwargs.
def scale(value: float = 1.0, /, factor: float = 2.0) -> float:
    return value * factor
