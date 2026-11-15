# A required kwargs object after an optional positional makes it `T | undefined` but not optional.
def send(message: str, retries: int = 3, /, *, channel: str) -> bool:
    return True
