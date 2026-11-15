# `import typing` resolves fully dotted names.
import typing


def f(a: typing.Union[int, str], b: typing.Sequence[float], c: typing.Any) -> typing.Optional[bool]: ...
