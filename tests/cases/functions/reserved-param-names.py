# Positional parameters named after reserved words are escaped with `$`.
def make(new: str, function: str, /) -> str:
    return new + function
