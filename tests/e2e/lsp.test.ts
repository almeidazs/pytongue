// The editor experience through TypeScript 7.1's real language server with the built content
// mapper: hover, go-to-definition, references and diagnostics land on the Python source.
import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { LspClient, type Position } from '../harness/lsp';
import { buildPackage, linkPackage, ROOT } from '../helpers';

const root = join(ROOT, 'tests/.build/lsp');

const GREET = `# ótimo 🎉 — accents and an emoji (two UTF-16 units) before the code
from pydantic import BaseModel


class Greeting(BaseModel):
    message: str


def greet(name: str, *, shout: bool = False) -> Greeting:
    """Builds a greeting."""
    return Greeting(message=name)


def untyped(x) -> int:
    return 1


def broken(:
    pass
`;

const INDEX = `import { greet, type Greeting } from './greet.py';

const greeting: Greeting = await greet('Ana');

greeting.message;

await greet(42);
`;

/**
 * Finds the position of a substring.
 *
 * @param text - The document text.
 * @param needle - The text to find.
 * @param shift - Characters to move into the match.
 * @param occurrence - Which match, counting from 0.
 * @returns A zero-based LSP position.
 */
function at(text: string, needle: string, shift = 0, occurrence = 0): Position {
	let index = -1;

	for (let i = 0; i <= occurrence; i++)
		index = text.indexOf(needle, index + 1);

	if (index < 0) throw new Error(`${needle} not found`);

	const before = text.slice(0, index + shift);
	const line = before.split('\n').length - 1;

	return { line, character: index + shift - (before.lastIndexOf('\n') + 1) };
}

let client: LspClient;

beforeAll(async () => {
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
			contentMappers: [
				{
					package: 'pytongue',
					extensions: ['.py'],
					options: { strict: true },
				},
			],
			include: ['*.ts', '*.py'],
		}),
	);
	writeFileSync(join(root, 'greet.py'), GREET);
	writeFileSync(join(root, 'index.ts'), INDEX);

	client = await new LspClient(root).initialize();
	client.open('index.ts', INDEX, 'typescript');
	client.open('greet.py', GREET, 'python');
}, 120_000);

afterAll(async () => {
	await client.close();
});

describe('hover', () => {
	test('an imported function shows its Python signature and docstring', async () => {
		const hover = await client.hover('index.ts', at(INDEX, 'greet(', 1, 0));

		expect(hover).toContain('function greet(name: string');
		expect(hover).toContain('shout?: boolean');
		expect(hover).toContain('Promise<Greeting>');
		expect(hover).toContain('Builds a greeting.');
	});

	test('a model property shows its Python-derived type', async () => {
		const hover = await client.hover('index.ts', at(INDEX, 'message', 1));

		expect(hover).toContain('Greeting.message: string');
	});
});

describe('go to definition', () => {
	test('a call lands on the Python def, past the unicode header', async () => {
		const [location] = await client.definition(
			'index.ts',
			at(INDEX, "greet('Ana')", 1),
		);

		expect(location?.uri).toBe(client.uri('greet.py'));
		expect(location?.range.start).toEqual(at(GREET, 'def greet', 4));
		expect(location?.range.end).toEqual(at(GREET, 'def greet', 9));
	});

	test('the import specifier lands on the same Python name', async () => {
		const [location] = await client.definition(
			'index.ts',
			at(INDEX, 'greet', 1),
		);

		expect(location?.uri).toBe(client.uri('greet.py'));
		expect(location?.range.start).toEqual(at(GREET, 'def greet', 4));
	});

	test('a model type lands on the Python class', async () => {
		const [location] = await client.definition(
			'index.ts',
			at(INDEX, 'Greeting', 1, 1),
		);

		expect(location?.uri).toBe(client.uri('greet.py'));
		expect(location?.range.start).toEqual(at(GREET, 'class Greeting', 6));
	});

	test('a model property lands on the Python field', async () => {
		const [location] = await client.definition(
			'index.ts',
			at(INDEX, 'message', 1),
		);

		expect(location?.uri).toBe(client.uri('greet.py'));
		expect(location?.range.start).toEqual(at(GREET, 'message: str'));
	});
});

describe('find references', () => {
	test('includes the Python declaration and every use in TypeScript', async () => {
		const references = await client.references(
			'index.ts',
			at(INDEX, "greet('Ana')", 1),
		);
		const files = references.map((r) => r.uri.split('/').pop());

		expect(files.filter((f) => f === 'index.ts')).toHaveLength(3);
		expect(references).toContainEqual({
			uri: client.uri('greet.py'),
			range: {
				start: at(GREET, 'def greet', 4),
				end: at(GREET, 'def greet', 9),
			},
		});
	});
});

describe('diagnostics', () => {
	test('strict mode reports a missing hint on the Python line', async () => {
		const diagnostics = await client.diagnostics('greet.py');
		const missing = diagnostics.find((d) => d.code === 1002);

		expect(missing?.source).toBe('pytongue');
		expect(missing?.range.start).toEqual(at(GREET, 'untyped(x', 8));
		expect(missing?.range.end).toEqual(at(GREET, 'untyped(x', 9));
	});

	test('a syntax error is reported at its place in the Python file', async () => {
		const diagnostics = await client.diagnostics('greet.py');
		const syntax = diagnostics.find((d) => d.code === 1001);

		expect(syntax?.message).toContain('Python syntax error');
		expect(syntax?.range.start.line).toBe(at(GREET, 'def broken').line);
	});

	test('a TypeScript type error in the caller points at the call', async () => {
		const diagnostics = await client.diagnostics('index.ts');
		const wrong = diagnostics.find((d) => d.code === 2345);

		expect(wrong?.message).toContain(
			"'number' is not assignable to parameter of type 'string'",
		);
		expect(wrong?.range.start).toEqual(at(INDEX, 'greet(42', 6));
	});

	test('fixing the Python source clears its diagnostics (didChange)', async () => {
		const fixed = GREET.replace('untyped(x)', 'untyped(x: int)').replace(
			'def broken(:',
			'def broken() -> None:',
		);

		client.change('greet.py', fixed, 2);

		expect(await client.diagnostics('greet.py')).toEqual([]);
	});
});
