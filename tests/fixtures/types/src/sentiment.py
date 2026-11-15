# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""A toy sentiment classifier, called from TypeScript."""

from __future__ import annotations

import datetime
from collections.abc import AsyncIterator, Iterator
from typing import Literal

from pydantic import BaseModel, Field, computed_field

from .models import Lang, Score, Span, Token, _Stamp

Label = Literal["positive", "negative", "neutral"]

__all__ = ["classify", "classify_many", "stream_tokens", "slow_words", "untyped", "Result", "Token", "pick"]


class Result(BaseModel):
    """Classification result."""

    label: Label
    score: Score = Field(description="Confidence in [0, 1].")
    tokens: list[Token] = []
    spans: list[Span] = []
    at: datetime.datetime | None = None
    stamp: _Stamp | None = None

    @computed_field
    @property
    def confident(self) -> bool:
        return self.score > 0.8


def classify(text: str, top_k: int = 3, *, lang: Lang = Lang.PT) -> Result:
    """Classify the sentiment of `text`."""
    words = text.lower().split()
    good = sum(w in {"great", "good", "ótima", "ótimo", "boa"} for w in words)
    bad = sum(w in {"bad", "awful", "ruim", "péssima"} for w in words)
    label: Label = "positive" if good > bad else "negative" if bad > good else "neutral"
    score = 0.5 if label == "neutral" else min(1.0, 0.6 + 0.2 * abs(good - bad))
    return Result(label=label, score=score, tokens=[Token(text=w) for w in words[:top_k]])


async def classify_many(texts: list[str], /, *extra: str, **options: bool) -> list[Result]:
    return [classify(t) for t in [*texts, *extra]]


def stream_tokens(text: str) -> Iterator[Token]:
    for word in text.split():
        yield Token(text=word)


async def slow_words(text: str) -> AsyncIterator[str]:
    for word in text.split():
        yield word


def untyped(x, y: int):
    return x


def pick(items: list[str], index: int = 0, /, default: str | None = None) -> str | None:
    return items[index] if index < len(items) else default


def _private() -> None:
    pass
