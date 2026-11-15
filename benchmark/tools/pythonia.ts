/**
 * pythonia: JavaScript drives a Python process through its own IPC protocol and gets proxies
 * back. `PYTHON_BIN` points it at the venv that has the `javascript` package installed.
 *
 * @module
 */
import { BENCH_PY, PYTHON } from '../shared.ts';
import type { Adapter, Payload, Session } from '../types.ts';

/** A pythonia proxy of the benchmark module. */
interface BenchProxy {
	add(a: number, b: number): Promise<number>;
	echo(payload: Payload): Promise<{ valueOf(): Promise<unknown> }>;
	cpu(n: number): Promise<number>;
}

/** The pythonia adapter. */
const adapter: Adapter = {
	id: 'pythonia',
	label: 'pythonia',
	kind: 'bridge',
	synchronous: false,
	note: 'pythonia drives a Python process with its own IPC protocol and returns proxies; `PYTHON_BIN` points at the venv.',
	needs: ['npm', 'venv'],
	async open(): Promise<Session> {
		process.env.PYTHON_BIN = PYTHON;

		const imported = (await import('pythonia')) as unknown as {
			python: ((file: string) => Promise<BenchProxy>) & { exit(): void };
		};
		const { python } = imported;
		const bench = await python(BENCH_PY);

		return {
			add: (a, b) => bench.add(a, b),
			// A returned dict is a proxy: reading its value is a second round trip.
			echo: async (payload) => (await bench.echo(payload)).valueOf(),
			cpu: (n) => bench.cpu(n),
			close: async () => python.exit(),
		};
	},
};

export default adapter;
