# Strict: unparseable, f-string, bytes, escaped and concatenated string annotations are unknown.
# @strict: true
def f(
    a: "list[",  # E:8 pytongue1003
    b: f"int",  # E:8 pytongue1003
    c: b"int",  # E:8 pytongue1003
    d: "in\x74",  # E:8 pytongue1003
    e: "Opt" "ional[int]",  # E:8 pytongue1003
) -> None: ...
