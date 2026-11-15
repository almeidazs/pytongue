/**
 * pytongue as a consumer uses it: the `.py` file is imported through the `pytongue/register`
 * preload (`node --import` / `bun --preload`), and every call is validated by Pydantic in the
 * long-lived worker that `uv run` starts.
 *
 * @module
 */
import { BENCH_PY } from '../shared.ts';
import type { Adapter, Payload, Session } from '../types.ts';

/** The functions the generated module exports. */
interface BenchModule {
	add(a: number, b: number): Promise<number>;
	echo(payload: Payload): Promise<unknown>;
	cpu(n: number): Promise<number>;
}

/** The pytongue adapter. */
const adapter: Adapter = {
	id: 'pytongue',
	label: 'pytongue',
	kind: 'bridge',
	synchronous: false,
	note: 'a `.py` file imported through the `pytongue/register` preload; one long-lived `uv run` worker, NDJSON over a private pipe, every call validated by Pydantic.',
	needs: ['build'],
	async open(): Promise<Session> {
		// A variable specifier: the file is resolved by the preload, not by a type checker.
		const specifier = BENCH_PY;
		const module = (await import(specifier)) as BenchModule;

		return {
			add: (a, b) => module.add(a, b),
			echo: (payload) => module.echo(payload),
			cpu: (n) => module.cpu(n),
			close: async () => {},
		};
	},
};

export default adapter;
