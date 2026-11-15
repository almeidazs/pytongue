# A keyword-only parameter without a default makes the kwargs object required.
def connect(host: str, *, port: int) -> None:
    pass
