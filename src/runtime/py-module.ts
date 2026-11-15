/**
 * The entry point generated `.py` modules call: one {@link WorkerProcess} per file, and one
 * forwarding function per Python function.
 *
 * @module
 */
import type { EnvSpec, Layout, PyFunction, PyModule } from '@/types/runtime';

import { CallEncoder } from './call-encoder';
import { StreamIterator } from './stream-iterator';
import { WorkerProcess } from './worker-process';

const workers = new Map<string, WorkerProcess>();

/**
 * Builds a function that forwards calls to a Python function.
 *
 * @param worker - The worker of the function's file.
 * @param name - The Python function name.
 * @param layout - Its call layout.
 * @returns A function returning a promise, or an async iterable for a generator.
 */
function forwarder(
	worker: WorkerProcess,
	name: string,
	layout: Layout,
): PyFunction {
	const encoder = new CallEncoder(name, layout);

	const call: PyFunction = (...args) => {
		if (layout.gen)
			// Encoded when iteration starts, so each `for await` re-runs the generator.
			return {
				[Symbol.asyncIterator]: () =>
					new StreamIterator(worker, name, encoder.encode(args)),
			};

		try {
			const wire = encoder.encode(args);

			return worker
				.request({ op: 'call', fn: name, ...wire })
				.then((response) => (layout.void ? undefined : response.value));
		} catch (error) {
			return Promise.reject(error);
		}
	};

	Object.defineProperty(call, 'name', { value: name });

	return call;
}

/**
 * Returns the module handle of an imported `.py` file; the generated module calls
 * `pyModule(file, env).fn(name, layout)` once per exported function.
 *
 * @param file - The Python file's absolute path.
 * @param env - The environment its worker runs in.
 * @returns The module handle (its worker is shared by every import of the file).
 */
export function pyModule(file: string, env: EnvSpec): PyModule {
	let worker = workers.get(file);

	if (!worker) {
		worker = new WorkerProcess(file, env);
		workers.set(file, worker);
	}

	const shared = worker;

	return { fn: (name, layout) => forwarder(shared, name, layout) };
}
