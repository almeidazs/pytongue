import { expect, test } from 'bun:test';

import { loadParser, parsePython } from '@/engine/parser';

test('parsing before the parser is loaded is a clear error', async () => {
	// A query string gives a fresh instance of the module, with nothing loaded yet.
	const specifier = '@/engine/parser/tree-sitter.ts?fresh';
	const fresh = (await import(
		specifier
	)) as typeof import('@/engine/parser/tree-sitter');

	expect(() => fresh.parsePython('x')).toThrow('await loadParser() first');
});

test('the parser is shared and parses synchronously once loaded', async () => {
	const first = await loadParser();

	expect(await loadParser()).toBe(first);
	expect(parsePython('def f(): ...').rootNode.type).toBe('module');
});
