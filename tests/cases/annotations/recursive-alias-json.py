# A recursive alias is cut where it comes back to itself, not expanded to the depth limit.
Json = dict[str, "Json"] | list["Json"] | str | int | None


def f(a: Json) -> None: ...
