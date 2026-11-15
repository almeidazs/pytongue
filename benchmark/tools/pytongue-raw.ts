/**
 * "pytongue (no validation)": a hand-written NDJSON worker started with `uv run`, the way
 * pytongue starts its own. It removes the type-driven Pydantic validation and the generated
 * module, so the gap to the `pytongue` row is the cost of those two.
 *
 * @module
 */
import { PY_DIR, UV } from '../shared.ts';
import type { Adapter, Session } from '../types.ts';
import { NdjsonClient } from './ndjson-client.ts';

/** The no-validation adapter. */
const adapter: Adapter = {
	id: 'pytongue-raw',
	label: 'pytongue (no validation)',
	kind: 'baseline',
	synchronous: false,
	note: 'a hand-written ~30-line Python worker started with `uv run` and spoken to over NDJSON with `child_process`; no generated module and no validation.',
	needs: [],
	async open(): Promise<Session> {
		const client = new NdjsonClient(
			UV,
			['run', '--quiet', '--no-project', 'python', 'ndjson_worker.py'],
			PY_DIR,
		);

		return {
			add: (a, b) => client.call('add', [a, b]) as Promise<number>,
			echo: (payload) => client.call('echo', [payload]),
			cpu: (n) => client.call('cpu', [n]) as Promise<number>,
			close: () => client.close(),
		};
	},
};

export default adapter;
