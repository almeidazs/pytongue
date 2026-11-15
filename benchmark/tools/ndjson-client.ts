/**
 * A tiny NDJSON request/response client over a child process, shared by the hand-written
 * worker adapter. It speaks `{id, fn, args}` and reads `{id, value}`.
 *
 * @module
 */
import { type ChildProcessWithoutNullStreams, spawn } from 'node:child_process';

/** A request waiting for its response line. */
interface Pending {
	resolve(value: unknown): void;
	reject(error: Error): void;
}

/** Talks to one long-lived NDJSON worker. */
export class NdjsonClient {
	private readonly child: ChildProcessWithoutNullStreams;
	private readonly pending = new Map<number, Pending>();
	private nextId = 1;
	private buffer = '';

	/**
	 * Spawns the worker.
	 *
	 * @param command - The executable.
	 * @param args - Its arguments.
	 * @param cwd - The working directory.
	 */
	constructor(command: string, args: string[], cwd: string) {
		this.child = spawn(command, args, {
			cwd,
			stdio: ['pipe', 'pipe', 'pipe'],
		});
		this.child.stdout.setEncoding('utf8');
		this.child.stdout.on('data', (chunk: string) => this.onData(chunk));
		this.child.stderr.resume();
		this.child.stdin.on('error', () => {});
		this.child.on('error', (error) => this.failAll(error));
		this.child.on('exit', (code) =>
			this.failAll(new Error(`worker exited with code ${code}`)),
		);
	}

	/**
	 * Calls a function in the worker.
	 *
	 * @param fn - The Python function name.
	 * @param args - Its positional arguments.
	 * @returns The value the worker answered with.
	 */
	call(fn: string, args: unknown[]): Promise<unknown> {
		const id = this.nextId++;
		const response = new Promise<unknown>((resolve, reject) =>
			this.pending.set(id, { resolve, reject }),
		);

		this.child.stdin.write(`${JSON.stringify({ id, fn, args })}\n`);

		return response;
	}

	/**
	 * Closes the worker's stdin and stops it.
	 *
	 * @returns Resolves immediately: the process is killed, not awaited.
	 */
	async close(): Promise<void> {
		this.child.stdin.end();
		this.child.kill();
	}

	/**
	 * Splits stdout into lines and settles the matching request of each.
	 *
	 * @param chunk - A chunk of stdout.
	 */
	private onData(chunk: string): void {
		this.buffer += chunk;

		let newline = this.buffer.indexOf('\n');

		while (newline >= 0) {
			const line = this.buffer.slice(0, newline);

			this.buffer = this.buffer.slice(newline + 1);
			newline = this.buffer.indexOf('\n');

			if (!line) continue;

			const message = JSON.parse(line) as { id: number; value: unknown };

			this.pending.get(message.id)?.resolve(message.value);
			this.pending.delete(message.id);
		}
	}

	/**
	 * Rejects every waiting request.
	 *
	 * @param error - Why the worker is gone.
	 */
	private failAll(error: Error): void {
		for (const request of this.pending.values()) request.reject(error);

		this.pending.clear();
	}
}
