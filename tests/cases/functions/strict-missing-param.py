# @strict: true
# Strict mode reports each parameter without a hint at its name.
def pair(a, b: int, *, c=0) -> int:  # E:10 pytongue1002 # E:24 pytongue1002
    return b
