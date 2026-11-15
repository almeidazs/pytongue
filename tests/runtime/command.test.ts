import { expect, test } from 'bun:test';

import { workerCommand } from '@/runtime';

test('uv command lines', () => {
	expect(
		workerCommand('/x.py', {
			kind: 'script',
			requiresPython: '>=3.12',
			dependencies: ['httpx'],
		}).args.join(' '),
	).toMatch(
		/^run --quiet --no-project --python >=3\.12 --with pydantic>=2 --with httpx python .*\/python\/bridge\.py \/x\.py$/,
	);
	expect(
		workerCommand('/x.py', { kind: 'project', root: '/p' }).args.slice(
			0,
			4,
		),
	).toEqual(['run', '--quiet', '--project', '/p']);
});
