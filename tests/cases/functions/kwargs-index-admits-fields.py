# The `**kwargs` index signature admits the types of every named kwargs field.
def call(*, target: str, timeout: float = 1.0, **flags: bool) -> None:
    pass
