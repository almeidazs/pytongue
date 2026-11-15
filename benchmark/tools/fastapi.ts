/* oxlint-disable no-await-in-loop -- the benchmark measures calls made one after another */
/**
 * FastAPI served by uvicorn (started with `uv run --with fastapi --with uvicorn`) and called
 * with `fetch`. The server is started by the session and waited on until `/health` answers,
 * so cold start includes the server boot.
 *
 * @module
 */
import { type ChildProcess, spawn } from 'node:child_process';
import { createServer } from 'node:net';

import { PY_DIR, UV } from '../shared.ts';
import type { Adapter, Payload, Session } from '../types.ts';

/**
 * Asks the OS for a free TCP port.
 *
 * @returns A port that was free a moment ago.
 */
function freePort(): Promise<number> {
	return new Promise((resolve, reject) => {
		const server = createServer();

		server.on('error', reject);
		server.listen(0, '127.0.0.1', () => {
			const { port } = server.address() as { port: number };

			server.close(() => resolve(port));
		});
	});
}

/**
 * Polls `/health` until the server answers or the process dies.
 *
 * @param base - The server's base URL.
 * @param child - The uvicorn process.
 * @returns Resolves once the server is ready.
 */
async function waitReady(base: string, child: ChildProcess): Promise<void> {
	let exited: number | null | undefined;

	child.on('exit', (code) => (exited = code));

	for (let attempt = 0; attempt < 600; attempt++) {
		if (exited !== undefined)
			throw new Error(`uvicorn exited with code ${exited}`);

		try {
			const response = await fetch(`${base}/health`);

			if (response.ok) return;
		} catch {
			// not listening yet
		}

		await new Promise((resolve) => setTimeout(resolve, 10));
	}

	throw new Error('uvicorn did not become ready within 6 s');
}

/** The FastAPI adapter. */
const adapter: Adapter = {
	id: 'fastapi',
	label: 'FastAPI + uvicorn (HTTP)',
	kind: 'http',
	synchronous: false,
	note: 'a FastAPI app served by one uvicorn worker (`uv run --with fastapi --with uvicorn`, `async def` handlers) and called with `fetch` over loopback HTTP/1.1 keep-alive.',
	needs: [],
	async open(): Promise<Session> {
		const port = await freePort();
		const base = `http://127.0.0.1:${port}`;
		const child = spawn(
			UV,
			[
				'run',
				'--quiet',
				'--no-project',
				'--with',
				'fastapi',
				'--with',
				'uvicorn',
				'python',
				'-m',
				'uvicorn',
				'fastapi_app:app',
				'--host',
				'127.0.0.1',
				'--port',
				String(port),
				'--log-level',
				'warning',
			],
			{ cwd: PY_DIR, stdio: ['ignore', 'ignore', 'pipe'] },
		);
		let stderr = '';

		child.stderr?.on(
			'data',
			(chunk: Buffer) => (stderr += chunk.toString()),
		);

		try {
			await waitReady(base, child);
		} catch (error) {
			child.kill();

			const detail = stderr.trim().split('\n').pop();

			throw new Error(
				`${(error as Error).message}${detail ? ` (${detail})` : ''}`,
				{ cause: error },
			);
		}

		/**
		 * POSTs a JSON body and returns the decoded JSON response.
		 *
		 * @param path - The endpoint.
		 * @param body - The JSON body.
		 * @returns The decoded response.
		 */
		const post = async (path: string, body: unknown): Promise<unknown> => {
			const response = await fetch(`${base}${path}`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(body),
			});

			return response.json();
		};

		return {
			add: (a, b) => post('/add', { a, b }) as Promise<number>,
			echo: (payload: Payload) => post('/echo', payload),
			cpu: (n) => post('/cpu', { n }) as Promise<number>,
			close: async () => {
				child.kill();
			},
		};
	},
};

export default adapter;
