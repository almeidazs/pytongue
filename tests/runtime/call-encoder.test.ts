import { describe, expect, test } from 'bun:test';

import { CallEncoder } from '@/runtime';
import type { Layout } from '@/types/runtime';

const layout: Layout = {
	req: 1,
	opt: ['b', 'c'],
	rest: true,
	kw: true,
	gen: false,
	void: false,
};

/**
 * Encodes one call of `f`.
 *
 * @param input - The JavaScript arguments.
 * @param override - Layout fields to change.
 * @returns The wire form.
 */
const encode = (input: unknown[], override: Partial<Layout> = {}) =>
	new CallEncoder('f', { ...layout, ...override }).encode(input);

describe('CallEncoder', () => {
	test('positionals, rest, kwargs; trailing undefined optionals are dropped', () => {
		expect(encode(['a'])).toEqual({ args: ['a'], rest: null, kwargs: {} });
		expect(encode(['a', 1, undefined, { k: 1 }])).toEqual({
			args: ['a', 1],
			rest: null,
			kwargs: { k: 1 },
		});
		expect(encode(['a', 1, 2, [3, 4], { k: 1 }])).toEqual({
			args: ['a', 1, 2],
			rest: [3, 4],
			kwargs: { k: 1 },
		});
	});

	test('a gap in positional-only parameters, *args without them, and extra arguments are TypeErrors', () => {
		expect(() => encode(['a', undefined, 2])).toThrow(
			'cannot skip positional-only parameter `b`',
		);
		expect(() => encode(['a', 1, undefined, [3]])).toThrow(
			'`*args` requires every positional parameter',
		);
		expect(() =>
			encode(['a', {}, 'extra'], { rest: false, opt: [] }),
		).toThrow('too many arguments');
		expect(() => encode(['a', 5], { rest: false, opt: [] })).toThrow(
			'expected the keyword arguments object',
		);
	});
});
