# Strict: names that are neither builtins, imports nor module definitions are unresolved.
# @strict: true
def f(
    a: Missing,  # E:8 pytongue1005
    b: missing.attr,  # E:8 pytongue1005
    c: Missing[int],  # E:8 pytongue1005
) -> None: ...
