# Untyped `*args` gives the overload an `unknown[]` array.
def collect(*items) -> int:
    return len(items)
