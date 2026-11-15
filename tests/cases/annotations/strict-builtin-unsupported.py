# Strict: builtins without a JSON mapping (complex, bare type) are not supported.
# @strict: true
def f(
    c: complex,  # E:8 pytongue1003
    t: type,  # E:8 pytongue1003
) -> None: ...
