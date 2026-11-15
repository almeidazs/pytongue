/**
 * Discovers the fixture corpus in `tests/cases/` and materializes each case on disk.
 *
 * A case is one `.py` file. Leading `# @name: value` comments are directives:
 *
 * - `# @strict: true` turns on the mapper's strict mode.
 * - `# @filename: other.py` starts another file of the same case (TypeScript's multi-file syntax);
 *   the text before the first `@filename` is `main.py`.
 *
 * @module
 */
import {
	mkdirSync,
	readdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';

import { ROOT } from '../helpers';

/** The fixture corpus. */
export const CASES_DIR = join(ROOT, 'tests/cases');

/** Where cases are written out as real files (gitignored). */
export const BUILD_DIR = join(ROOT, 'tests/.build');

/** One file of a case. */
export interface CaseFile {
	/** The file name, relative to the case directory (`main.py`, `models.py`, `pkg/__init__.py`). */
	name: string;
	/** The file contents. */
	content: string;
}

/** One fixture. */
export interface Case {
	/** `area/name`, from the path under `tests/cases/`. */
	id: string;
	/** Whether the mapper runs in strict mode. */
	strict: boolean;
	/** The files; the first one is `main.py`. */
	files: CaseFile[];
}

const FILENAME = /^#\s*@filename:\s*(\S+)\s*$/;
const DIRECTIVE = /^#\s*@(\w+):\s*(.+?)\s*$/;

/**
 * Lists every `.py` file under a directory, sorted.
 *
 * @param dir - The directory to walk.
 * @returns Absolute paths.
 */
function walk(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true })
		.flatMap((entry) => {
			const path = join(dir, entry.name);

			if (entry.isDirectory()) return walk(path);

			return entry.name.endsWith('.py') ? [path] : [];
		})
		.toSorted();
}

/**
 * Parses one fixture file.
 *
 * @param path - The fixture's absolute path.
 * @param text - Its contents.
 * @returns The case.
 */
export function parseCase(path: string, text: string): Case {
	const id = relative(CASES_DIR, path)
		.split(sep)
		.join('/')
		.replace(/\.py$/, '');
	const files: CaseFile[] = [{ name: 'main.py', content: '' }];
	const directives = new Map<string, string>();
	let current = files[0]!;

	for (const line of text.split('\n')) {
		const filename = FILENAME.exec(line);

		if (filename) {
			current = { name: filename[1]!, content: '' };
			files.push(current);
			continue;
		}

		const directive = DIRECTIVE.exec(line);

		if (directive && directive[1] !== 'filename')
			directives.set(directive[1]!, directive[2]!);

		current.content += line + '\n';
	}

	for (const file of files) file.content = file.content.replace(/\n+$/, '\n');

	return { id, strict: directives.get('strict') === 'true', files };
}

/** Restricts the corpus to ids starting with this prefix (`PYTONGUE_CASES=models`). */
export const CASE_FILTER = process.env.PYTONGUE_CASES ?? '';

/**
 * Loads the cases of the corpus, honouring {@link CASE_FILTER}.
 *
 * @returns The cases, sorted by id.
 */
export function loadCases(): Case[] {
	return walk(CASES_DIR)
		.map((path) => parseCase(path, readFileSync(path, 'utf8')))
		.filter((testCase) => testCase.id.startsWith(CASE_FILTER));
}

/**
 * Writes a case's files under a root, one directory per case.
 *
 * @param root - The build root.
 * @param testCase - The case.
 * @returns The case directory.
 */
export function materialize(root: string, testCase: Case): string {
	const dir = join(root, testCase.id);

	rmSync(dir, { recursive: true, force: true });

	for (const file of testCase.files) {
		const path = join(dir, file.name);

		mkdirSync(dirname(path), { recursive: true });
		writeFileSync(path, file.content);
	}

	return dir;
}

/**
 * The baseline path of one output of a case file.
 *
 * @param testCase - The case.
 * @param file - The file name within the case.
 * @param extension - The baseline extension.
 * @returns `cases/<id>.<ext>` for single-file cases, `cases/<id>/<file>.<ext>` otherwise.
 */
export function baselineName(
	testCase: Case,
	file: string,
	extension: string,
): string {
	if (testCase.files.length === 1) return `cases/${testCase.id}${extension}`;

	return `cases/${testCase.id}/${file.replace(/\.py$/, '')}${extension}`;
}
