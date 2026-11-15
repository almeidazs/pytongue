// What the real TypeScript checker sees for every corpus case, through TypeScript 7.1's API with
// the built content mapper: export types and any TypeScript error inside the virtual module.
import { afterAll, beforeAll, describe, test } from 'bun:test';
import { rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { API, type Checker, type Program } from 'typescript/async';

import { expectBaseline } from '../harness/baseline';
import {
	baselineName,
	BUILD_DIR,
	loadCases,
	materialize,
} from '../harness/cases';
import { renderTypes } from '../harness/types';
import { buildPackage, linkPackage } from '../helpers';

const cases = loadCases();
const roots = {
	default: join(BUILD_DIR, 'types', 'default'),
	strict: join(BUILD_DIR, 'types', 'strict'),
};
const projects = new Map<
	string,
	{ api: API; program: Program; checker: Checker }
>();

beforeAll(async () => {
	buildPackage();

	for (const [mode, root] of Object.entries(roots)) {
		rmSync(root, { recursive: true, force: true });

		for (const testCase of cases)
			if (testCase.strict === (mode === 'strict'))
				materialize(root, testCase);

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
				contentMappers: [
					{
						package: 'pytongue',
						extensions: ['.py'],
						...(mode === 'strict'
							? { options: { strict: true } }
							: {}),
					},
				],
				include: ['**/*.py'],
			}),
		);

		const api = new API({ cwd: root, runExternalCode: true });
		const snapshot = await api.createSnapshot({
			openProjects: [join(root, 'tsconfig.json')],
		});
		const project = snapshot.getProjects()[0]!;

		projects.set(mode, {
			api,
			program: project.program,
			checker: project.checker,
		});
	}
}, 120_000);

afterAll(async () => {
	for (const { api } of projects.values()) await api.close();
});

describe('checker types', () => {
	test.each(cases.map((c) => [c.id, c] as const))(
		'%s',
		async (_id, testCase) => {
			const mode = testCase.strict ? 'strict' : 'default';
			const { program, checker } = projects.get(mode)!;
			const dir = join(roots[mode], testCase.id);

			for (const file of testCase.files)
				expectBaseline(
					baselineName(testCase, file.name, '.types'),
					await renderTypes(
						program,
						checker,
						join(dir, file.name),
						dir,
					),
				);
		},
	);
});
