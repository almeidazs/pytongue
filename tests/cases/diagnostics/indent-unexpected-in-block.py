# An unexpected indent inside a block is a syntax error.
def f(x: int) -> int:
    return x
      y = 1  # E:1 pytongue1001
