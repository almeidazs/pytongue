"""Prepared: Pydantic validation of arguments and JSON serialization of results."""

import datetime
import decimal
import enum
import uuid
from collections.abc import AsyncIterator, Callable, Iterator
from types import ModuleType
from typing import Annotated, Any

import pytest
from hypothesis import given
from hypothesis import strategies as st
from pydantic import BaseModel, Field, ValidationError

from pytongue_bridge.prepared import Prepared


class Item(BaseModel):
    name: str
    qty: int = 1


class Aliased(BaseModel):
    snake_name: str = Field(alias="snakeName")


class Color(enum.Enum):
    RED = "red"


def test_arguments_are_validated_against_annotations() -> None:
    def add(a: int, b: int) -> int:
        return a + b

    prepared = Prepared(add)

    assert prepared.call(1, 2) == 3
    assert prepared.call("3", 4) == 7  # Pydantic's lax mode coerces numeric strings

    with pytest.raises(ValidationError):
        _ = prepared.call("three", 4)


def test_models_are_built_from_plain_dicts() -> None:
    def total(items: list[Item]) -> int:
        return sum(item.qty for item in items)

    assert Prepared(total).call([{"name": "a"}, {"name": "b", "qty": 3}]) == 4


def test_keyword_arguments_are_validated_too() -> None:
    def f(*, flag: bool = False) -> bool:
        return flag

    with pytest.raises(ValidationError):
        _ = Prepared(f).call(flag="maybe")


@pytest.mark.parametrize(
    ("value", "expected"),
    [
        (datetime.datetime(2026, 11, 15, 12, 30), "2026-11-15T12:30:00"),
        (datetime.date(2026, 11, 15), "2026-11-15"),
        (uuid.UUID(int=1), "00000000-0000-0000-0000-000000000001"),
        (decimal.Decimal("1.5"), "1.5"),
        ({1, 2}, [1, 2]),
        ((1, "a"), [1, "a"]),
        (Color.RED, "red"),
        (b"abc", "abc"),
    ],
)
def test_results_become_their_json_form(value: Any, expected: object) -> None:
    def f() -> Any:
        return value

    assert Prepared(f).serialize(value) == expected


def test_models_serialize_by_alias() -> None:
    def make() -> Aliased:
        return Aliased(snakeName="x")

    assert Prepared(make).serialize(Aliased(snakeName="x")) == {"snakeName": "x"}


def test_return_annotation_drives_serialization_of_nested_models() -> None:
    def make() -> dict[str, list[Item]]:
        return {"items": [Item(name="a")]}

    assert Prepared(make).serialize({"items": [Item(name="a")]}) == {
        "items": [{"name": "a", "qty": 1}]
    }


def test_unannotated_functions_still_serialize() -> None:
    def f():  # type: ignore[no-untyped-def]
        return {"when": datetime.date(2026, 1, 2)}

    assert Prepared(f).serialize(f()) == {"when": "2026-01-02"}


def test_generator_items_are_serialized_with_the_element_type() -> None:
    def gen() -> Iterator[Item]:
        yield Item(name="a")

    prepared = Prepared(gen)

    assert prepared.is_gen
    assert prepared.serialize(Item(name="a")) == {"name": "a", "qty": 1}


def test_async_generators_are_detected() -> None:
    async def gen() -> AsyncIterator[int]:
        yield 1

    assert Prepared(gen).is_async_gen


def test_integers_beyond_two_to_the_53_raise() -> None:
    def f() -> int:
        return 2**60

    with pytest.raises(OverflowError):
        _ = Prepared(f).serialize(2**60)


def test_nan_in_a_result_fails_to_be_a_json_value() -> None:
    from pytongue_bridge.channel import Channel  # noqa: F401

    def f() -> float:
        return float("nan")

    # Serialization keeps NaN as a float; the channel is what rejects it (allow_nan=False).
    value = Prepared(f).serialize(float("nan"))

    assert value != value  # noqa: PLR0124 - NaN is the only value not equal to itself


def test_schema_less_annotations_pass_through(capsys: pytest.CaptureFixture[str]) -> None:
    class Opaque:
        pass

    def f(x: Opaque) -> int:
        return 1

    prepared = Prepared(f)

    assert prepared.call(Opaque()) == 1
    assert capsys.readouterr().err == ""


def test_validation_that_pydantic_cannot_build_falls_back_with_a_note(
    capsys: pytest.CaptureFixture[str],
) -> None:
    class Odd:
        def __get_pydantic_core_schema__(self, *_: object) -> object:
            raise RuntimeError("no schema")

    def f(x: Annotated[int, Odd()]) -> int:
        return x

    prepared = Prepared(f)

    assert prepared.call(5) == 5
    assert "cannot validate" in capsys.readouterr().err


@given(st.integers(-(2**53 - 1), 2**53 - 1), st.text())
def test_property_serializing_primitives_is_the_identity(number: int, text: str) -> None:
    def f() -> dict[str, object]:
        return {}

    prepared = Prepared(f)

    assert prepared.serialize({"n": number, "t": text}) == {"n": number, "t": text}
