/**
 * pymport: an embedded CPython (its own 3.12.2) loaded as an N-API addon, so calls are
 * in-process and synchronous. Payloads are converted to and from real Python objects.
 *
 * @module
 */
import { PY_DIR } from '../shared.ts';
import type { Adapter, Payload, Session } from '../types.ts';

/** A Python object handle. */
interface PyObject {
	get(name: string): PyObject;
	call(...args: unknown[]): PyObject;
	toJS(): unknown;
	toString(): string;
}

/** The slice of pymport's API used here. */
interface PyMport {
	pymport(name: string): PyObject;
	PyObject: { fromJS(value: unknown): PyObject };
}

/** The pymport adapter. */
const adapter: Adapter = {
	id: 'pymport',
	label: 'pymport (in-process)',
	kind: 'in-process',
	synchronous: true,
	note: 'an embedded CPython bundled with the package, loaded as an N-API addon: in-process, no IPC, synchronous; payloads are converted to and from real Python objects.',
	needs: ['npm'],
	// `PyObject.fromJS` grows roughly quadratically: ~0.5 s for 100 KB, tens of seconds for 1 MB.
	limits: { largePayloadCalls: 1 },
	async open(): Promise<Session> {
		// A variable specifier: the package's `exports` hides its typings from the compiler.
		const specifier = 'pymport';
		const { pymport, PyObject } = (await import(specifier)) as PyMport;
		const sys = pymport('sys');

		sys.get('path').get('append').call(PY_DIR);

		const bench = pymport('bench');
		const add = bench.get('add');
		const echo = bench.get('echo');
		const cpu = bench.get('cpu');
		const version = sys.get('version').toString().split(' ')[0];

		return {
			info: `embedded CPython ${version}`,
			add: (a, b) => add.call(a, b).toJS() as number,
			echo: (payload: Payload) =>
				echo.call(PyObject.fromJS(payload)).toJS(),
			cpu: (n) => cpu.call(n).toJS() as number,
			close: async () => {},
		};
	},
};

export default adapter;
