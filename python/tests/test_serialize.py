"""check_safe_ints: integers JavaScript cannot represent exactly must be rejected, anywhere."""

import pytest
from hypothesis import given
from hypothesis import strategies as st

from pytongue_bridge.serialize import MAX_SAFE_INT, check_safe_ints

json_scalars = st.one_of(st.none(), st.booleans(), st.floats(allow_nan=False), st.text())
safe_ints = st.integers(min_value=-MAX_SAFE_INT, max_value=MAX_SAFE_INT)
unsafe_ints = st.integers(min_value=MAX_SAFE_INT + 1) | st.integers(max_value=-MAX_SAFE_INT - 1)


def nest(leaves: st.SearchStrategy[object]) -> st.SearchStrategy[object]:
    return st.recursive(
        leaves,
        lambda children: st.lists(children) | st.dictionaries(st.text(), children),
        max_leaves=20,
    )


def test_boundaries() -> None:
    check_safe_ints(MAX_SAFE_INT)
    check_safe_ints(-MAX_SAFE_INT)

    with pytest.raises(OverflowError, match="safe integer range"):
        check_safe_ints(MAX_SAFE_INT + 1)

    with pytest.raises(OverflowError):
        check_safe_ints(-MAX_SAFE_INT - 1)


def test_booleans_are_not_integers() -> None:
    check_safe_ints(True)
    check_safe_ints({"flag": False})


def test_walks_dicts_lists_and_tuples() -> None:
    big = 2**60

    for container in ({"a": {"b": [big]}}, [[big]], (1, (big,)), [{"x": big}]):
        with pytest.raises(OverflowError):
            check_safe_ints(container)


def test_message_names_the_value() -> None:
    with pytest.raises(OverflowError, match=str(2**60)):
        check_safe_ints(2**60)


@given(nest(json_scalars | safe_ints))
def test_any_safe_structure_passes(value: object) -> None:
    check_safe_ints(value)


@given(nest(json_scalars | safe_ints), unsafe_ints)
def test_one_unsafe_int_anywhere_fails(value: object, bad: int) -> None:
    with pytest.raises(OverflowError):
        check_safe_ints([value, {"deep": [bad]}])
