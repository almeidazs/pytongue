# Names imported from pydantic submodules resolve like `pydantic.X`.
import pydantic.types
from pydantic.networks import HttpUrl
from pydantic.types import PositiveInt


def f(a: HttpUrl, b: PositiveInt, c: pydantic.types.StrictBool) -> None: ...
