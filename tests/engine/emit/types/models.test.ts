import { beforeAll, describe, expect, test } from 'bun:test';

import { loadParser } from '@/engine/parser';

import { emitModule, squash } from '../../../helpers';

beforeAll(async () => {
	await loadParser();
});

describe('models', () => {
	test('output has every field; Input makes defaults optional and follows aliases and inheritance', () => {
		const { text } = emitModule(`
from pydantic import BaseModel, Field
class Base(BaseModel):
    id: int = 0
class User(Base):
    name: str
    nick: str | None = Field(None, alias="nickname")
    tags: list[str] = Field(default_factory=list)
    secret: str = Field(..., validation_alias="pw", serialization_alias="password")
`);

		expect(squash(text)).toContain(
			'interface User extends Base { name: string; nickname: string | null; tags: string[]; password: string; }',
		);
		expect(squash(text)).toContain(
			'declare namespace User { interface Input extends Base.Input { name: string; nickname?: string | null; tags?: string[]; pw: string; } }',
		);
		expect(squash(text)).toContain('export type { Base, User };');
	});

	test('a model without defaults gets Input as a plain alias; TypedDict honours total and NotRequired', () => {
		const { text } = emitModule(`
from typing import TypedDict, NotRequired, Required
from pydantic import BaseModel
class P(BaseModel):
    x: int
class T(TypedDict, total=False):
    a: int
    b: Required[str]
class U(TypedDict):
    c: NotRequired[int]
`);

		expect(squash(text)).toContain(
			'declare namespace P { type Input = P; }',
		);
		expect(squash(text)).toContain(
			'interface T { a?: number; b: string; }',
		);
		expect(squash(text)).toContain('interface U { c?: number; }');
	});

	test('a Python class named Input hoists input shapes out of the namespaces', () => {
		const { text } = emitModule(`
from pydantic import BaseModel
class Input(BaseModel):
    v: int = 0
class Wrapper(BaseModel):
    inner: Input
`);

		expect(squash(text)).toContain(
			'interface $Input$Wrapper { inner: Input.Input; }',
		);
		expect(squash(text)).toContain(
			'declare namespace Wrapper { type Input = $Input$Wrapper; }',
		);
	});
});
