# A kwargs field named after a reserved word stays a plain property name.
def pick(items: list[str], *, default: str = "") -> str:
    return default
