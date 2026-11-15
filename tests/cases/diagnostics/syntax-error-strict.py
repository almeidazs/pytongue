# @strict: true
# Syntax errors and strict-mode unknowns are reported together.
def f(x) -> int:  # E:7 pytongue1002
    return 1


y = = 2  # E:5 pytongue1001
