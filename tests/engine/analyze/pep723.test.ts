import { expect, test } from 'bun:test';

import { scriptMetadata } from '@/engine/analyze';

test('PEP 723 script metadata is extracted', () => {
	expect(
		scriptMetadata(
			`# /// script\n# requires-python = ">=3.12"\n# dependencies = [\n#   "httpx",\n# ]\n# ///\nimport httpx\n`,
		),
	).toBe('requires-python = ">=3.12"\ndependencies = [\n  "httpx",\n]\n');
	expect(scriptMetadata('print(1)\n')).toBeUndefined();
});
