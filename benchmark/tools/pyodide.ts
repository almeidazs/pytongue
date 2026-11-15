/**
 * Pyodide: CPython compiled to WebAssembly (a different interpreter: 3.14), running inside
 * the JavaScript runtime. Calls are synchronous and objects are converted to and from real
 * Python objects.
 *
 * @module
 */
import { readFileSync } from 'node:fs';

import { BENCH_PY } from '../shared.ts';
import type { Adapter, Payload, Session } from '../types.ts';

/** A Pyodide proxy of a Python object. */
interface PyProxy {
	toJs(options: object): unknown;
	destroy(): void;
}

/** A Python callable exposed to JavaScript. */
type PyFunction = ((...args: unknown[]) => unknown) & PyProxy;

/** The slice of the Pyodide API used here. */
interface Pyodide {
	version: string;
	runPython(code: string): unknown;
	toPy(value: unknown): PyProxy;
	globals: { get(name: string): PyFunction };
}

/** The Pyodide adapter. */
const adapter: Adapter = {
	id: 'pyodide',
	label: 'pyodide (WASM, Python 3.14)',
	kind: 'wasm',
	synchronous: true,
	note: 'CPython compiled to WebAssembly, in-process and synchronous; a different interpreter (3.14) from the other rows; payloads are converted to and from real Python objects.',
	needs: ['npm'],
	async open(): Promise<Session> {
		const { loadPyodide } = (await import('pyodide')) as unknown as {
			loadPyodide(): Promise<Pyodide>;
		};
		const py = await loadPyodide();

		py.runPython(readFileSync(BENCH_PY, 'utf8'));

		const add = py.globals.get('add');
		const echo = py.globals.get('echo');
		const cpu = py.globals.get('cpu');
		const python = String(
			py.runPython('import sys; sys.version.split()[0]'),
		);

		return {
			info: `Pyodide ${py.version} (WASM CPython ${python})`,
			add: (a, b) => add(a, b) as number,
			echo: (payload: Payload) => {
				const input = py.toPy(payload);
				const output = echo(input) as PyProxy;
				const value = output.toJs({
					dict_converter: Object.fromEntries,
					create_pyproxies: false,
				});

				input.destroy();
				output.destroy();

				return value;
			},
			cpu: (n) => cpu(n) as number,
			close: async () => {},
		};
	},
};

export default adapter;
