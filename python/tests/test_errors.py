"""error_payload: what Node's PythonError and PythonValidationError are built from."""

import json

import pytest
from pydantic import BaseModel, ValidationError

from pytongue_bridge.errors import error_payload


class Item(BaseModel):
    name: str
    qty: int


def test_plain_exception() -> None:
    try:
        raise ValueError("boom")
    except ValueError as exc:
        payload = error_payload(exc)

    assert payload["type"] == "ValueError"
    assert payload["module"] == "builtins"
    assert payload["message"] == "boom"
    assert isinstance(payload["traceback"], str)
    assert "ValueError: boom" in payload["traceback"]
    assert "validation" not in payload


def test_qualified_name_of_nested_class() -> None:
    class Inner(Exception):
        pass

    assert error_payload(Inner("x"))["type"].endswith("Inner")  # type: ignore[union-attr]
    assert "<locals>" in error_payload(Inner("x"))["type"]  # type: ignore[operator]


def test_validation_error_carries_pydantic_errors() -> None:
    with pytest.raises(ValidationError) as caught:
        Item.model_validate({"name": 1, "qty": "many"})

    payload = error_payload(caught.value)
    validation = payload["validation"]

    assert isinstance(validation, list)
    assert {entry["loc"][0] for entry in validation} == {"name", "qty"}  # type: ignore[index,union-attr]
    assert all("msg" in entry and "type" in entry for entry in validation)  # type: ignore[operator]
    assert "url" not in validation[0]  # type: ignore[operator]


def test_payload_is_json_serializable() -> None:
    with pytest.raises(ValidationError) as caught:
        Item.model_validate({})

    json.dumps(error_payload(caught.value), allow_nan=False)


def test_chained_exceptions_keep_the_chain_in_the_traceback() -> None:
    try:
        try:
            raise KeyError("inner")
        except KeyError as inner:
            raise RuntimeError("outer") from inner
    except RuntimeError as exc:
        text = error_payload(exc)["traceback"]

    assert isinstance(text, str)
    assert "KeyError" in text
    assert "RuntimeError: outer" in text


def test_unicode_message() -> None:
    assert error_payload(ValueError("ótimo 🎉"))["message"] == "ótimo 🎉"
