# A union element type is parenthesized in the `*args` array.
def total(*values: int | float) -> float:
    return sum(values)
