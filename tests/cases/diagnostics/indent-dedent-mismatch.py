# A dedent to a level no enclosing block has is a syntax error.
def f(x: int) -> None:
    if x:
        a = 1
      b = 2  # E:1 pytongue1001
