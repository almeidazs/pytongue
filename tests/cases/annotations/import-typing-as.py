# `import typing as t` resolves attribute access through the alias.
import typing as t


def f(a: t.Optional[int], b: t.List[str], c: t.Dict[str, t.Any], d: t.Literal[1, 2]) -> t.Tuple[int, str]: ...
