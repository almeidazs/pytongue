# The `|` operator builds the same unions as typing.Union.
def f(
    a: int | str,
    b: str | None,
    c: int | str | bool | None,
    d: (int | str) | None,
    e: str | str,
    f: None | None,
) -> None: ...
