"""Serialization of Python exceptions for Node."""

import json
import traceback
from typing import cast

from pydantic import ValidationError

from .protocol import JsonObject


def error_payload(exc: BaseException) -> JsonObject:
    """Describes an exception the way Node's ``PythonError`` expects.

    Args:
        exc: Any exception.

    Returns:
        ``type``, ``module``, ``message`` and ``traceback``, plus ``validation`` (Pydantic's
        ``errors()``) for a ``ValidationError``.
    """
    payload: JsonObject = {
        "type": type(exc).__qualname__,
        "module": type(exc).__module__,
        "message": str(exc),
        "traceback": "".join(traceback.format_exception(exc)),
    }

    if isinstance(exc, ValidationError):
        payload["validation"] = cast(object, json.loads(exc.json(include_url=False)))

    return payload
