// Generated Python functions, end to end: the emitted TypeScript must accept the call built from
// its signature, and the real worker must run that call and return what Python itself returns.
import { beforeAll, describe, expect, test } from 'bun:test';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import * as fc from 'fast-check';

import { analyzePython } from '@/engine/analyze';
import { envSpec, layoutOf } from '@/engine/emit/runtime';
import { fsHost, loadParser } from '@/engine/parser';
import { pyModule } from '@/runtime';

import { runs, SEED } from '../harness/fuzz';
import {
	genModule,
	moduleSource,
	type GenFunction,
} from '../harness/python-gen';
import { buildPackage, linkPackage, ROOT } from '../helpers';

const root = join(ROOT, 'tests/.build/generated');
const modules = fc.sample(
	fc.array(genModule(6), { minLength: runs(8, 60), maxLength: runs(8, 60) }),
	{
		seed: SEED,
		numRuns: 1,
	},
)[0]!;

beforeAll(async () => {
	await loadParser();
	buildPackage();
	rmSync(root, { recursive: true, force: true });
	mkdirSync(root, { recursive: true });
	linkPackage(root);
	writeFileSync(
		join(root, 'tsconfig.json'),
		JSON.stringify({
			compilerOptions: {
				module: 'nodenext',
				strict: true,
				noEmit: true,
				types: [],
			},
			contentMappers: [{ package: 'pytongue', extensions: ['.py'] }],
			include: ['*.ts', '*.py'],
		}),
	);

	modules.forEach((functions, index) => {
		writeFileSync(join(root, `m${index}.py`), moduleSource(functions));
	});
}, 120_000);

/**
 * Writes a TypeScript call of a generated function, using the arguments built for it.
 *
 * @param index - The module index.
 * @param fn - The function.
 * @returns One awaited call.
 */
function callSource(index: number, fn: GenFunction): string {
	return `await m${index}.${fn.name}(${fn.args.map((a) => (a === undefined ? 'undefined' : JSON.stringify(a))).join(', ')});`;
}

describe('generated functions', () => {
	test('the emitted TypeScript accepts a call built from each signature', () => {
		const lines = modules.flatMap((functions, index) => [
			`import * as m${index} from './m${index}.py';`,
			...functions.map((fn) => callSource(index, fn)),
		]);

		writeFileSync(
			join(root, 'calls.ts'),
			`${lines.join('\n')}\nexport {};\n`,
		);

		const tsc = Bun.spawnSync(
			[
				join(ROOT, 'node_modules/.bin/tsc'),
				'-p',
				root,
				'--noEmit',
				'--runExternalCode',
			],
			{ cwd: ROOT },
		);

		expect(tsc.stdout.toString()).toBe('');
		expect(tsc.exitCode).toBe(0);
	}, 120_000);

	test.each(modules.map((m, i) => [i, m] as const))(
		'module %i: the worker returns what Python returns',
		async (index, functions) => {
			const file = join(root, `m${index}.py`);
			const source = moduleSource(functions);
			const info = analyzePython(source, file, fsHost);
			const module = pyModule(file, envSpec(info, file, fsHost));

			for (const fn of functions) {
				const layout = layoutOf(
					info.functions.find((f) => f.name === fn.name)!,
				);
				const call = module.fn(fn.name, layout);

				expect({ fn: fn.name, got: await call(...fn.args) }).toEqual({
					fn: fn.name,
					got: fn.expected,
				});
			}
		},
		120_000,
	);
});
