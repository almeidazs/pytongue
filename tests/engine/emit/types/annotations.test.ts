import { beforeAll, describe, expect, test } from 'bun:test';

import { loadParser } from '@/engine/parser';

import { emitModule, squash } from '../../../helpers';

beforeAll(async () => {
	await loadParser();
});

describe('annotations', () => {
	test('typing constructs, forward references and aliases', () => {
		const { text } = emitModule(`
from __future__ import annotations
import datetime as dt
from typing import Optional, Literal, Annotated, Any
from pydantic import Field
Label = Literal["a", "b"]
type Pair = tuple[int, str]
def f(
    a: Optional["dict[str, list[float]]"],
    b: Label | None,
    c: Annotated[int, Field(gt=0)],
    d: tuple[int, ...],
    e: Pair,
    g: dt.datetime,
    h: Any,
    i: Literal[-1, True, None, "x"],
    j: bytes,
) -> dict[Literal["k"], int]: ...
`);

		expect(squash(text)).toContain(
			'declare function f(a: Record<string, number[]> | null, b: "a" | "b" | null, c: number, d: number[], e: [number, string], g: string, h: unknown, i: -1 | true | null | "x", j: unknown): Promise<Partial<Record<"k", number>>>;',
		);
	});

	test('enums are unions of their values, including auto()', () => {
		const { text } = emitModule(`
from enum import Enum, IntEnum, StrEnum, auto
class A(StrEnum):
    X = auto()
    Y = auto()
class B(IntEnum):
    ONE = 1
    TWO = auto()
`);

		expect(text).toContain('type A = "x" | "y";');
		expect(text).toContain('type B = 1 | 2;');
	});
});
