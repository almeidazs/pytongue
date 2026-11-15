import { beforeAll, describe, expect, test } from 'bun:test';
import { join } from 'node:path';

import { analyzePython } from '@/engine/analyze';
import { envSpec, reexportLayout, runtimeModule } from '@/engine/emit/runtime';
import { fsHost, loadParser } from '@/engine/parser';
import { packageFile } from '@/shared';

import { memoryHost } from '../../../helpers';

beforeAll(async () => {
	await loadParser();
});

const files = {
	'/p/main.py': [
		'import json',
		'from .impl import helper as h, Model, util_mod',
		'from . import impl',
		'__all__ = ["h", "Model", "impl", "json"]',
	].join('\n'),
	'/p/impl.py':
		'from pydantic import BaseModel\n\nclass Model(BaseModel):\n    x: int\n\ndef helper(a: int, *, b: int = 1) -> int:\n    return a + b\n',
};

describe('re-exports in the generated module', () => {
	const host = memoryHost(files);
	let js = '';

	beforeAll(() => {
		js = runtimeModule(
			files['/p/main.py'],
			'/p/main.py',
			host,
			'file:///r.js',
		);
	});

	test('a function re-exported from another file keeps its own call layout', () => {
		expect(js).toContain(
			'$m.fn("h", {"req":1,"opt":[],"rest":false,"kw":true,"gen":false,"void":false})',
		);
	});

	test('a name that came from a package is called with positional arguments only', () => {
		expect(js).toContain('"generic":true');
	});

	test('classes and modules have no runtime value', () => {
		expect(js).not.toContain('"Model"');
		expect(js).not.toContain('"impl"');
	});

	test('a re-exported function that cannot be read gets the generic layout', () => {
		expect(reexportLayout('/p/missing.py', 'f', host)).toMatchObject({
			generic: true,
		});
		expect(reexportLayout('/p/impl.py', 'nope', host)).toMatchObject({
			generic: true,
		});
	});
});

describe('environment errors', () => {
	test('invalid PEP 723 TOML names the file and keeps the cause', () => {
		const source = '# /// script\n# dependencies = [\n# ///\n';
		const info = analyzePython(source, '/p/bad.py', memoryHost());

		expect(() => envSpec(info, '/p/bad.py', memoryHost())).toThrow(
			/invalid PEP 723 metadata in \/p\/bad\.py/,
		);
	});

	test('non-string dependencies are ignored and requires-python is optional', () => {
		const source = '# /// script\n# dependencies = ["httpx", 3]\n# ///\n';
		const info = analyzePython(source, '/p/ok.py', memoryHost());

		expect(envSpec(info, '/p/ok.py', memoryHost())).toEqual({
			kind: 'script',
			dependencies: ['httpx'],
		});
	});
});

describe('files', () => {
	test('fsHost tells files from directories and missing files', () => {
		expect(fsHost.fileExists(import.meta.filename)).toBe(true);
		expect(fsHost.fileExists(import.meta.dir)).toBe(false);
		expect(fsHost.fileExists(join(import.meta.dir, 'nope.py'))).toBe(false);
		expect(
			fsHost.readFile(join(import.meta.dir, 'nope.py')),
		).toBeUndefined();
		expect(fsHost.readFile(import.meta.filename)).toContain('fsHost');
	});

	test('packageFile finds the grammar and rejects a file the package lacks', () => {
		expect(packageFile('grammar/tree-sitter-python.wasm')).toContain(
			'tree-sitter-python.wasm',
		);
		expect(() => packageFile('nothing/here.txt')).toThrow(
			'cannot find nothing/here.txt',
		);
	});
});
