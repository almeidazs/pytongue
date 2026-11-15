# A generator without a return hint yields unknown, with a generator-specific reason.
def numbers():
    yield 1
