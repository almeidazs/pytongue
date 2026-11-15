# Strict: `bytes` has no JSON form, as a parameter or as a return type.
# @strict: true
def f(
    a: bytes,  # E:8 pytongue1003
) -> bytes: ...  # E:6 pytongue1003
