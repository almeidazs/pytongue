# A name bound to a variable or function is not a type alias.
LIMIT = 10
handler = print


def f(a: LIMIT, b: handler) -> None: ...
