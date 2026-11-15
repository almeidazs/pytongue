# @strict: true
# should not generate diagnostics
# A PEP 723 block has no effect on the types.
# /// script
# requires-python = ">=3.12"
# dependencies = ["numpy"]
# ///


def mean(values: list[float]) -> float:
    return sum(values) / len(values)
