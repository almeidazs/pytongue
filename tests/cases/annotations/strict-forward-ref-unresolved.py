# Strict: an unresolved name inside a string annotation is reported inside the string.
# @strict: true
def f(
    a: "Missing",  # E:9 pytongue1005
    b: "list[Missing]",  # E:14 pytongue1005
    c: "list['Missing']",  # E:15 pytongue1005
) -> None: ...
