// The runtime classes against a real uv-spawned Python worker, in this process (so coverage sees
// them): errors, streams, crashes and a missing uv.
import { afterEach, beforeAll, describe, expect, test } from 'bun:test';
import { mkdirSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { analyzePython } from '@/engine/analyze';
import { envSpec, layoutOf } from '@/engine/emit/runtime';
import { fsHost, loadParser } from '@/engine/parser';
import {
	PythonError,
	PythonValidationError,
	PythonWorkerError,
	pyModule,
	toPythonError,
} from '@/runtime';

import { ROOT } from '../helpers';

const dir = join(ROOT, 'tests/.build/runtime-worker');

const SOURCE = `
import os
from collections.abc import AsyncIterator, Iterator

from pydantic import BaseModel


class Item(BaseModel):
    name: str


CLOSED = []


def echo(item: Item) -> Item:
    return item


def boom() -> None:
    raise ValueError("boom")


def exit_now() -> None:
    os._exit(3)


def counter(n: int) -> Iterator[int]:
    try:
        yield from range(n)
    finally:
        CLOSED.append("counter")


async def acount(n: int) -> AsyncIterator[int]:
    for i in range(n):
        yield i


def closed() -> list[str]:
    return list(CLOSED)


def failing() -> Iterator[int]:
    yield 1
    raise RuntimeError("mid-stream")
`;

let counter = 0;

/**
 * Writes the worker module to a fresh file and returns its functions.
 *
 * @param source - The Python source.
 * @returns A function that builds a callable by name.
 */
function load(source = SOURCE) {
	const file = join(dir, `m${counter++}.py`);

	writeFileSync(file, source);

	const info = analyzePython(source, file, fsHost);
	const module = pyModule(file, envSpec(info, file, fsHost));

	const layout = (name: string) =>
		layoutOf(info.functions.find((f) => f.name === name)!);

	return {
		file,
		// A function that returns a promise.
		fn: (name: string) =>
			module.fn(name, layout(name)) as (
				...args: unknown[]
			) => Promise<unknown>,
		// A generator function that returns an async iterable.
		gen: (name: string) =>
			module.fn(name, layout(name)) as (
				...args: unknown[]
			) => AsyncIterable<number>,
	};
}

beforeAll(async () => {
	await loadParser();
	rmSync(dir, { recursive: true, force: true });
	mkdirSync(dir, { recursive: true });
});

afterEach(() => {
	delete process.env.PYTONGUE_UV;
});

describe('errors', () => {
	test('a Python exception rejects with its type, message and traceback', async () => {
		const error = await load()
			.fn('boom')()
			.catch((e: unknown) => e);

		expect(error).toBeInstanceOf(PythonError);
		expect((error as PythonError).pyType).toBe('ValueError');
		expect((error as PythonError).pyModule).toBe('builtins');
		expect((error as PythonError).message).toBe('ValueError: boom');
		expect((error as PythonError).traceback).toContain('boom');
	});

	test('invalid arguments reject with Pydantic errors', async () => {
		const error = await load()
			.fn('echo')({ name: 1 })
			.catch((e: unknown) => e);

		expect(error).toBeInstanceOf(PythonValidationError);
		expect((error as PythonValidationError).errors).toHaveLength(1);
	});

	test('toPythonError picks the class from the payload', () => {
		const payload = { type: 'X', module: 'm', message: 'y', traceback: '' };

		expect(toPythonError(payload)).toBeInstanceOf(PythonError);
		expect(toPythonError({ ...payload, validation: [] })).toBeInstanceOf(
			PythonValidationError,
		);
		expect(new PythonWorkerError('w', 1, 'SIGKILL', 'tail')).toMatchObject({
			exitCode: 1,
			signal: 'SIGKILL',
			stderr: 'tail',
			name: 'PythonWorkerError',
		});
	});
});

describe('generators', () => {
	test('items stream in order; a second iteration restarts the generator', async () => {
		const count = load().gen('counter');
		const first: number[] = [];
		const second: number[] = [];

		for await (const n of count(3)) first.push(n);

		for await (const n of count(2)) second.push(n);

		expect(first).toEqual([0, 1, 2]);
		expect(second).toEqual([0, 1]);
	});

	test('async generators stream too', async () => {
		const out: number[] = [];

		for await (const n of load().gen('acount')(3)) out.push(n);

		expect(out).toEqual([0, 1, 2]);
	});

	test('break closes the Python generator', async () => {
		const m = load();

		for await (const n of m.gen('counter')(100)) if (n === 1) break;

		await Bun.sleep(300);

		expect(await m.fn('closed')()).toEqual(['counter']);
	});

	test('return() and throw() close the stream', async () => {
		const m = load();
		const iterator = m.gen('counter')(100)[Symbol.asyncIterator]();

		expect(await iterator.next()).toEqual({ done: false, value: 0 });
		expect(await iterator.return?.('x')).toEqual({
			done: true,
			value: 'x',
		});
		expect(await iterator.next()).toEqual({ done: true, value: undefined });

		const other = m.gen('counter')(5)[Symbol.asyncIterator]();

		await other.next();
		await expect(other.throw?.(new Error('stop'))).rejects.toThrow('stop');
	});

	test('an exception inside a generator rejects the next() that hits it', async () => {
		const seen: number[] = [];

		const failing = load().gen('failing');

		const run = async () => {
			for await (const n of failing()) seen.push(n);
		};

		await expect(run()).rejects.toThrow('mid-stream');
		expect(seen).toEqual([1]);
	});
});

describe('worker lifecycle', () => {
	test('a crash rejects the call, and the next call starts a new worker', async () => {
		const m = load();
		const crashed = await m
			.fn('exit_now')()
			.catch((e: unknown) => e);

		expect(crashed).toBeInstanceOf(PythonWorkerError);
		expect((crashed as PythonWorkerError).exitCode).toBe(3);
		expect(await m.fn('echo')({ name: 'again' })).toEqual({
			name: 'again',
		});
	});

	test('a module that fails to import is not retried until its file changes', async () => {
		const m = load(
			'import no_such_module_anywhere_xyz\n\ndef f() -> int:\n    return 1\n',
		);
		const first = await m
			.fn('f')()
			.catch((e: unknown) => e);

		await Bun.sleep(300); // after the worker has exited

		const startedAt = Date.now();
		const second = await m
			.fn('f')()
			.catch((e: unknown) => e);

		expect(first).toBeInstanceOf(PythonError);
		expect(second).toBe(first);
		expect(Date.now() - startedAt).toBeLessThan(250);

		writeFileSync(m.file, 'def f() -> int:\n    return 7\n');
		utimesSync(m.file, new Date(), new Date(Date.now() + 5000));

		expect(await m.fn('f')()).toBe(7);
	});

	test('closing a stream whose worker already died is harmless', async () => {
		const m = load();
		const iterator = m.gen('counter')(100)[Symbol.asyncIterator]();

		await iterator.next();
		await m
			.fn('exit_now')()
			.catch(() => {});

		expect(await iterator.return?.()).toEqual({
			done: true,
			value: undefined,
		});
	});

	test('a file deleted after a failed start is not retried from a stale mtime', async () => {
		const m = load(
			'import no_such_module_anywhere_xyz\n\ndef f() -> int:\n    return 1\n',
		);
		const first = await m
			.fn('f')()
			.catch((e: unknown) => e);

		await Bun.sleep(200);
		rmSync(m.file);

		const second = await m
			.fn('f')()
			.catch((e: unknown) => e);

		expect(first).toBeInstanceOf(PythonError);
		expect(second).toBeInstanceOf(Error);
	});

	test('a missing uv is a clear PythonWorkerError', async () => {
		process.env.PYTONGUE_UV = '/nonexistent/uv';

		const error = await load()
			.fn('closed')()
			.catch((e: unknown) => e);

		expect(error).toBeInstanceOf(PythonWorkerError);
		expect((error as PythonWorkerError).message).toContain('Install uv');
	});

	test('arguments that do not fit are TypeErrors, not worker calls', async () => {
		await expect(load().fn('echo')({ name: 'x' }, 'extra')).rejects.toThrow(
			TypeError,
		);
	});
});
