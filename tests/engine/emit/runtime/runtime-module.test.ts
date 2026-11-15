import { beforeAll, describe, expect, test } from 'bun:test';

import { analyzePython } from '@/engine/analyze';
import { envSpec, layoutOf, runtimeModule } from '@/engine/emit/runtime';
import { loadParser } from '@/engine/parser';

import { memoryHost } from '../../../helpers';

beforeAll(async () => {
	await loadParser();
});

describe('environment', () => {
	test('precedence: PEP 723, then the nearest pyproject.toml, then isolated', () => {
		const script = `# /// script\n# requires-python = ">=3.12"\n# dependencies = ["httpx>=0.27"]\n# ///\n`;
		const host = memoryHost({
			'/p/pyproject.toml': '',
			'/p/src/a.py': script,
			'/p/src/b.py': '',
		});

		expect(
			envSpec(
				analyzePython(script, '/p/src/a.py', host),
				'/p/src/a.py',
				host,
			),
		).toEqual({
			kind: 'script',
			requiresPython: '>=3.12',
			dependencies: ['httpx>=0.27'],
		});
		expect(
			envSpec(
				analyzePython('', '/p/src/b.py', host),
				'/p/src/b.py',
				host,
			),
		).toEqual({
			kind: 'project',
			root: '/p',
		});

		const empty = memoryHost();

		expect(
			envSpec(analyzePython('', '/q/c.py', empty), '/q/c.py', empty),
		).toEqual({
			kind: 'isolated',
		});
	});
});

describe('generated module', () => {
	test('forwards exported functions with their call layout', () => {
		const source = `def f(a: int, b: int = 1, /, *, c: str = "") -> None: ...\ndef delete(x: int) -> int: ...\ndef _hidden() -> None: ...`;
		const js = runtimeModule(
			source,
			'/m.py',
			memoryHost({ '/m.py': source }),
			'file:///runtime.js',
		);

		expect(js).toContain(
			`const $f_0 = $m.fn("f", {"req":1,"opt":["b"],"rest":false,"kw":true,"gen":false,"void":true});`,
		);
		expect(js).toContain('export { $f_0 as f, $f_1 as delete };');
		expect(js).not.toContain('_hidden');
	});

	test('layout of a generator', () => {
		const info = analyzePython(
			`from typing import Iterator\ndef g(n: int) -> Iterator[int]:\n    yield n`,
			'/g.py',
			memoryHost(),
		);

		expect(layoutOf(info.functions[0]!)).toMatchObject({
			req: 1,
			gen: true,
			void: false,
		});
	});

	test('a syntax error fails the import with the file and line', () => {
		expect(() =>
			runtimeModule(
				'x = 1\ndef f(:\n  pass',
				'/s.py',
				memoryHost(),
				'file:///r.js',
			),
		).toThrow(/\/s\.py:2/);
	});
});
