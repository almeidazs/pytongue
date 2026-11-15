# Parameters after `*args` are keyword-only; one without a default makes kwargs required.
def tag(*names: str, color: str, bold: bool = False) -> list[str]:
    return list(names)
