import { beforeAll, describe, expect, test } from 'bun:test';

import { loadParser } from '@/engine/parser';

import { emitModule, squash } from '../../../helpers';

beforeAll(async () => {
	await loadParser();
});

describe('modules', () => {
	test("relative imports go through the other file's $py$ surface", () => {
		const { text } = emitModule(
			`from .models import Token as T\nfrom . import util\ndef f(t: T, u: util.Thing) -> None: ...`,
			{
				files: {
					'/project/src/models.py': '',
					'/project/src/util/__init__.py': '',
				},
			},
		);

		expect(text).toContain(
			'import type * as util from "./util/__init__.py";',
		);
		expect(text).toContain(
			'import type { $py$Token as T } from "./models.py";',
		);
		expect(squash(text)).toContain(
			'declare function f(t: T.Input, u: util.$py$Thing.Input): Promise<void>;',
		);
		expect(text).toContain(
			'export type { T as $py$T, util as $py$util, f as $py$f };',
		);
	});

	test('__all__ decides exports; a dynamic __all__ falls back to public names with a note', () => {
		const literal = emitModule(
			`__all__ = ["a"]\ndef a() -> None: ...\ndef b() -> None: ...`,
		);

		expect(literal.text).toContain('export { a };');
		expect(literal.text).not.toContain('declare function b');

		const dynamic = emitModule(
			`__all__ = ["a"]\n__all__ += ["b"]\ndef a() -> None: ...\ndef b() -> None: ...\ndef _c() -> None: ...`,
		);

		expect(dynamic.text).toContain('export { a, b };');
		expect(dynamic.text).toContain(
			'`__all__` is not a literal list of strings',
		);
	});

	test('names are mapped back to their Python identifiers', () => {
		const source = `def classify(text: str) -> str: ...`;
		const { text, mappings } = emitModule(source);
		const pairs = (mappings ?? []).map((m) => [
			text.slice(m[0], m[0] + m[1]),
			source.slice(m[2], m[2] + m[3]),
		]);

		expect(pairs).toContainEqual(['classify', 'classify']);
		expect(pairs).toContainEqual(['text', 'text']);
	});

	test('syntax errors are always reported', () => {
		const { diagnostics } = emitModule(`def broken(:\n    pass`);

		expect(diagnostics?.[0]?.code).toBe(1001);
	});
});
