# @strict: true
# Strict mode reports a generator annotation that is not an iterator type as untranslatable.
def items() -> list[int]:  # E:16 pytongue1003
    yield 1
