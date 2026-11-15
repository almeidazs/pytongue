# Both overloads keep the trailing kwargs object when `*args` is followed by defaults.
def mean(*values: float, weight: float = 1.0) -> float:
    return sum(values) * weight
