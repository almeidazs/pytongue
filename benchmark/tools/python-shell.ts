/**
 * python-shell in persistent mode: `send()` writes a JSON line to a long-lived Python
 * process and `on('message')` receives one parsed JSON line back. It runs the same minimal
 * worker as the no-validation row, but spawns the venv's Python directly instead of `uv run`.
 *
 * @module
 */
import { PY_DIR, PYTHON } from '../shared.ts';
import type { Adapter, Payload, Session } from '../types.ts';

/** The response line of the worker. */
interface Response {
	id: number;
	value: unknown;
}

/** The slice of python-shell's API used here. */
interface Shell {
	send(message: unknown): void;
	on(event: 'message', listener: (message: Response) => void): void;
	on(event: 'error', listener: (error: Error) => void): void;
	end(callback: () => void): void;
	kill(): void;
}

/** The python-shell adapter. */
const adapter: Adapter = {
	id: 'python-shell',
	label: 'python-shell',
	kind: 'bridge',
	synchronous: false,
	note: "python-shell 5 in persistent JSON mode (`send()` and `on('message')`) against the same minimal worker, started with the venv's `python` (no uv).",
	needs: ['npm', 'venv'],
	async open(): Promise<Session> {
		const imported = (await import('python-shell')) as unknown as {
			PythonShell?: new (script: string, options: object) => Shell;
			default?: {
				PythonShell: new (script: string, options: object) => Shell;
			};
		};
		const PythonShell =
			imported.PythonShell ?? imported.default?.PythonShell;

		if (!PythonShell)
			throw new Error('python-shell exports no PythonShell');

		const shell = new PythonShell('ndjson_worker.py', {
			mode: 'json',
			pythonPath: PYTHON,
			scriptPath: PY_DIR,
		});
		const pending = new Map<
			number,
			{ resolve(value: unknown): void; reject(error: Error): void }
		>();
		let nextId = 1;

		shell.on('message', (message) => {
			pending.get(message.id)?.resolve(message.value);
			pending.delete(message.id);
		});
		shell.on('error', (error) => {
			for (const request of pending.values()) request.reject(error);

			pending.clear();
		});

		const call = (fn: string, args: unknown[]): Promise<unknown> => {
			const id = nextId++;
			const response = new Promise<unknown>((resolve, reject) =>
				pending.set(id, { resolve, reject }),
			);

			shell.send({ id, fn, args });

			return response;
		};

		return {
			add: (a, b) => call('add', [a, b]) as Promise<number>,
			echo: (payload: Payload) => call('echo', [payload]),
			cpu: (n) => call('cpu', [n]) as Promise<number>,
			close: async () => shell.kill(),
		};
	},
};

export default adapter;
