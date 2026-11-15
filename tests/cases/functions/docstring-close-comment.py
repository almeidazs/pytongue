# A `*/` inside a docstring is escaped so it cannot close the JSDoc block.
def glob(pattern: str) -> list[str]:
    """Match paths such as src/*/index.py."""
    return []
