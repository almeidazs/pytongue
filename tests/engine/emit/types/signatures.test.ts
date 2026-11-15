import { beforeAll, describe, expect, test } from 'bun:test';

import { loadParser } from '@/engine/parser';

import { emitModule, squash } from '../../../helpers';

beforeAll(async () => {
	await loadParser();
});

describe('function signatures', () => {
	test('required params are positional; defaults and keyword-only go to the trailing kwargs object', () => {
		const { text } = emitModule(
			`def f(a: int, b: str = "", /, c: float = 1.0, *, d: bool, **kw: int) -> None: ...`,
		);

		expect(squash(text)).toContain(
			'declare function f(a: number, b: string | undefined, kw: { c?: number; d: boolean; [key: string]: number | boolean | undefined; }): Promise<void>;',
		);
	});

	test('*args produces an overload with a rest array before kwargs', () => {
		const { text } = emitModule(
			`def f(a: str, *rest: int, k: int = 1) -> str: ...`,
		);

		expect(squash(text)).toContain(
			'declare function f(a: string, kwargs?: { k?: number; }): Promise<string>;',
		);
		expect(squash(text)).toContain(
			'declare function f(a: string, rest: number[], kwargs?: { k?: number; }): Promise<string>;',
		);
	});

	test('a positional-only parameter with a default stays an optional positional', () => {
		const { text } = emitModule(
			`def f(items: list[str], index: int = 0, /) -> str | None: ...`,
		);

		expect(squash(text)).toContain(
			'declare function f(items: string[], index?: number): Promise<string | null>;',
		);
	});

	test('generators become AsyncIterable of their element type', () => {
		const { text } = emitModule(`
from typing import Iterator, AsyncGenerator
def g(n: int) -> Iterator[int]:
    yield n
async def h() -> AsyncGenerator[str, None]:
    yield "x"
def not_a_generator() -> int:
    f = lambda: (yield)
    return 1
`);

		expect(squash(text)).toContain(
			'declare function g(n: number): AsyncIterable<number>;',
		);
		expect(squash(text)).toContain(
			'declare function h(): AsyncIterable<string>;',
		);
		expect(squash(text)).toContain(
			'declare function not_a_generator(): Promise<number>;',
		);
	});

	test('names that are reserved in TS are exported through a $ alias', () => {
		const { text } = emitModule(`def delete(x: int) -> int: ...`);

		expect(text).toContain(
			'declare function $delete(x: number): Promise<number>;',
		);
		expect(text).toContain('export { $delete as delete };');
	});

	test('missing hints become unknown with a hover note, and no diagnostic outside strict mode', () => {
		const { text, diagnostics } = emitModule(
			`def f(x, y: int):\n    return x`,
		);

		expect(squash(text)).toContain(
			'declare function f(x: unknown, y: number): Promise<unknown>;',
		);
		expect(text).toContain(
			'@remarks pytongue: parameter `x` has no type hint, so it is typed as `unknown`.',
		);
		expect(diagnostics).toBeUndefined();
	});

	test('strict mode reports each unknown at its Python span', () => {
		const source = `def f(x, y: numpy.ndarray) -> int: ...`;
		const { diagnostics } = emitModule(source, { strict: true });

		expect(
			diagnostics?.map((d) => [
				d.code,
				source.slice(d.start, d.start + d.length),
			]),
		).toEqual([
			[1002, 'x'],
			[1005, 'numpy.ndarray'],
		]);
	});
});
