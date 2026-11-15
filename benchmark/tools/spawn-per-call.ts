/**
 * The naive baseline: one fresh Python process per call, payload on stdin, result on stdout.
 * It uses the venv's `python` directly (not `uv run`), otherwise uv's startup would dominate.
 *
 * @module
 */
import { spawn } from 'node:child_process';
import { join } from 'node:path';

import { PY_DIR, PYTHON } from '../shared.ts';
import type { Adapter, Session } from '../types.ts';

/** The subset of Bun's API used for spawning. */
interface BunSpawn {
	spawn(
		command: string[],
		options: { cwd: string; stdin: Blob; stdout: 'pipe'; stderr: 'ignore' },
	): { stdout: ReadableStream<Uint8Array>; exited: Promise<number> };
}

const SCRIPT = join(PY_DIR, 'spawn_call.py');

/**
 * Runs one call in a fresh process, with `Bun.spawn` on Bun and `child_process` on Node.
 *
 * @param fn - The Python function name.
 * @param args - Its positional arguments.
 * @returns The decoded `value` the process printed.
 */
async function callOnce(fn: string, args: unknown[]): Promise<unknown> {
	const input = JSON.stringify({ fn, args });
	const bun = (globalThis as { Bun?: BunSpawn }).Bun;

	if (bun) {
		const child = bun.spawn([PYTHON, SCRIPT], {
			cwd: PY_DIR,
			stdin: new Blob([input]),
			stdout: 'pipe',
			stderr: 'ignore',
		});
		const text = await new Response(child.stdout).text();

		await child.exited;

		return (JSON.parse(text) as { value: unknown }).value;
	}

	return new Promise((resolve, reject) => {
		const child = spawn(PYTHON, [SCRIPT], {
			cwd: PY_DIR,
			stdio: ['pipe', 'pipe', 'ignore'],
		});
		const chunks: Buffer[] = [];

		child.stdout.on('data', (chunk: Buffer) => chunks.push(chunk));
		child.on('error', reject);
		child.on('close', () => {
			try {
				const text = Buffer.concat(chunks).toString('utf8');

				resolve((JSON.parse(text) as { value: unknown }).value);
			} catch (error) {
				reject(error);
			}
		});
		child.stdin.on('error', () => {});
		child.stdin.end(input);
	});
}

/** The spawn-per-call adapter. */
const adapter: Adapter = {
	id: 'spawn-per-call',
	label: 'spawn per call',
	kind: 'baseline',
	synchronous: false,
	note: "a fresh `python` process per call (`child_process.spawn` on Node, `Bun.spawn` on Bun), payload on stdin; uses the venv's `python`, not `uv run`, so uv's startup does not dominate. Iteration counts are capped.",
	needs: ['venv'],
	limits: { latencyCalls: 300, warmupCalls: 20, throughputCalls: 500 },
	async open(): Promise<Session> {
		return {
			add: (a, b) => callOnce('add', [a, b]) as Promise<number>,
			echo: (payload) => callOnce('echo', [payload]),
			cpu: (n) => callOnce('cpu', [n]) as Promise<number>,
			close: async () => {},
		};
	},
};

export default adapter;
