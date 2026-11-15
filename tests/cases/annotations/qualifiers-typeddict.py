# Required, NotRequired and ReadOnly unwrap to the inner type in a TypedDict.
from typing import NotRequired, ReadOnly, Required, TypedDict


class Movie(TypedDict, total=False):
    title: Required[str]
    year: NotRequired[int]
    rating: ReadOnly[float]
    tags: ReadOnly[Required[list[str]]]
