# @strict: true
# Each bytes-like type is named in its own reason.


def f(
    a: bytes,  # E pytongue1003
    b: bytearray,  # E pytongue1003
    c: memoryview,  # E pytongue1003
) -> None: ...
