# A defaulted `X | None` field stays optional and keeps null in its type.
def search(query: str, limit: int | None = None) -> list[str]:
    return []
