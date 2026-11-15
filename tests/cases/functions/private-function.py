# A `_name` function is left out of the module entirely: neither declared nor exported.
def _helper(x: int) -> int:
    return x


def public(x: int) -> int:
    return _helper(x)
