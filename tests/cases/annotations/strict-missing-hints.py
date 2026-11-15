# Strict: missing parameter and return hints are reported on the parameter and function name.
# @strict: true
def f(a, b: int = 0, *args, **kwargs):  # E:5 pytongue1002  # E:7 pytongue1002  # E:23 pytongue1002  # E:31 pytongue1002
    pass
