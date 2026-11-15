/**
 * One Python worker process per `.py` file, started on first call, speaking NDJSON.
 *
 * @module
 */
import { spawn } from 'node:child_process';
import { statSync } from 'node:fs';

import {
	BACKOFF_MAX,
	BACKOFF_START,
	STDERR_TAIL,
	UV_INSTALL_URL,
	UV_ENV,
	type EnvSpec,
	type PendingRequest,
	type ReadySignal,
	type RefHandle,
	type StartupFailure,
	type StartupState,
	type WorkerChild,
	type WorkerMessage,
	type WorkerRequest,
	type WorkerResponse,
} from '@/types/runtime';

import { workerCommand } from './command';
import { PythonWorkerError, toPythonError } from './errors';

/** Owns the worker of one Python file: spawning, the ready handshake, requests and crashes. */
export class WorkerProcess {
	private child: WorkerChild | undefined;
	private ready: Promise<void> | undefined;
	private nextId = 1;
	private readonly pending = new Map<number, PendingRequest>();
	private stderrTail = '';
	/** Set when the module failed to import: no respawn until the file changes or the backoff passes. */
	private startupFailure: StartupFailure | undefined;

	/**
	 * Creates a worker handle; nothing starts until the first request.
	 *
	 * @param file - The Python file's absolute path.
	 * @param env - The environment to run it in.
	 */
	constructor(
		private readonly file: string,
		private readonly env: EnvSpec,
	) {}

	/**
	 * Sends a request and waits for its response, starting the worker if needed.
	 *
	 * @param message - The request (its id is added here).
	 * @returns The worker's response.
	 * @throws {PythonError} When Python raised.
	 * @throws {PythonWorkerError} When the worker could not start or died.
	 */
	async request(message: WorkerRequest): Promise<WorkerResponse> {
		await this.start();

		const child = this.child;

		// The worker can die between `ready` and this write.
		if (!child)
			throw new PythonWorkerError(
				`pytongue: the Python worker for ${this.file} exited before the call was sent`,
			);

		const id = this.nextId++;
		const response = new Promise<WorkerResponse>((resolve, reject) =>
			this.pending.set(id, { resolve, reject }),
		);

		this.updateRef();
		child.stdin.write(JSON.stringify({ id, ...message }) + '\n');

		return response;
	}

	/**
	 * Sends a notification that expects no response; dropped when no worker is running.
	 *
	 * @param message - The notification.
	 */
	notify(message: WorkerRequest): void {
		if (!this.child || !this.ready) return;

		this.child.stdin.write(JSON.stringify(message) + '\n');
	}

	/**
	 * Starts the worker, or returns the running one's ready promise.
	 *
	 * @returns Resolves once the module imported.
	 */
	private start(): Promise<void> {
		if (this.ready) return this.ready;

		const failure = this.startupFailure;

		if (
			failure &&
			failure.mtime === this.mtime() &&
			Date.now() < failure.until
		)
			return Promise.reject(failure.error);

		const { command, args } = workerCommand(this.file, this.env);
		const child = spawn(command, args, {
			stdio: ['pipe', 'pipe', 'pipe'],
			windowsHide: true,
		}) as WorkerChild;

		this.child = child;
		this.stderrTail = '';

		let signal: ReadySignal | undefined;
		const ready = new Promise<void>(
			(resolve, reject) => (signal = { resolve, reject }),
		);
		const state: StartupState = { isReady: false };

		child.stderr.on('data', (chunk: Buffer) => this.onStderr(chunk));
		this.readLines(child, (message) =>
			this.onMessage(message, signal!, state),
		);

		const fail = (error: PythonWorkerError) =>
			this.onExit(child, error, signal!, state.isReady);

		child.on('error', (err: NodeJS.ErrnoException) =>
			fail(new PythonWorkerError(this.spawnErrorMessage(command, err))),
		);
		child.on('exit', (code, killedBy) => {
			const how = killedBy
				? `was killed by ${killedBy}`
				: `exited with code ${code}`;

			fail(
				new PythonWorkerError(
					`pytongue: the Python worker for ${this.file} ${how}`,
					code,
					killedBy,
					this.stderrTail,
				),
			);
		});
		child.stdin.on('error', () => {}); // EPIPE after a crash is reported through "exit"
		this.ready = ready;
		// Until ready the child stays referenced, so a pending first call keeps Node alive.
		ready.then(
			() => this.updateRef(),
			() => {},
		);

		return ready;
	}

	/**
	 * Splits the worker's stdout into NDJSON messages.
	 *
	 * @param child - The worker.
	 * @param onMessage - Called once per decoded line.
	 */
	private readLines(
		child: WorkerChild,
		onMessage: (message: WorkerMessage) => void,
	): void {
		let buffer = '';

		child.stdout.setEncoding('utf8');
		child.stdout.on('data', (chunk: string) => {
			buffer += chunk;

			let newline: number;

			while ((newline = buffer.indexOf('\n')) >= 0) {
				const line = buffer.slice(0, newline);

				buffer = buffer.slice(newline + 1);

				if (line.trim()) onMessage(JSON.parse(line) as WorkerMessage);
			}
		});
	}

	/**
	 * Handles one message: the ready handshake, or a response to a pending request.
	 *
	 * @param message - The decoded line.
	 * @param signal - Settles the ready promise.
	 * @param state - Tracks whether the handshake succeeded.
	 */
	private onMessage(
		message: WorkerMessage,
		signal: ReadySignal,
		state: StartupState,
	): void {
		if ('ready' in message) {
			if (message.ready) {
				state.isReady = true;
				this.startupFailure = undefined;
				signal.resolve();
			} else {
				const error = toPythonError(message.error!);

				this.recordStartupFailure(error);
				signal.reject(error);
			}

			return;
		}

		const request = this.pending.get(message.id);

		if (!request) return;

		this.pending.delete(message.id);
		this.updateRef();

		if (message.ok) request.resolve(message);
		else request.reject(toPythonError(message.error!));
	}

	/**
	 * Handles the worker's end: fails the startup if it never got ready, and every pending request.
	 *
	 * @param child - The worker that ended (ignored when a newer one replaced it).
	 * @param error - Why it ended.
	 * @param signal - Settles the ready promise.
	 * @param wasReady - Whether the handshake had succeeded.
	 */
	private onExit(
		child: WorkerChild,
		error: PythonWorkerError,
		signal: ReadySignal,
		wasReady: boolean,
	): void {
		if (this.child !== child) return;

		this.child = undefined;
		this.ready = undefined;

		if (!wasReady) {
			if (!this.startupFailure || this.startupFailure.error !== error)
				this.recordStartupFailure(error);

			signal.reject(this.startupFailure?.error ?? error);
		}

		const pending = [...this.pending.values()];

		this.pending.clear();

		for (const request of pending) request.reject(error);
	}

	/**
	 * Forwards the worker's stderr and keeps its tail for error messages.
	 *
	 * @param chunk - A chunk of stderr.
	 */
	private onStderr(chunk: Buffer): void {
		process.stderr.write(chunk);
		this.stderrTail = (this.stderrTail + chunk.toString('utf8')).slice(
			-STDERR_TAIL,
		);
	}

	/**
	 * Explains a spawn failure.
	 *
	 * @param command - The command that failed.
	 * @param err - The spawn error.
	 * @returns The message, with install instructions when uv is missing.
	 */
	private spawnErrorMessage(
		command: string,
		err: NodeJS.ErrnoException,
	): string {
		return err.code === 'ENOENT'
			? `pytongue: \`${command}\` was not found. Install uv (${UV_INSTALL_URL}) or set ${UV_ENV} to its path.`
			: `pytongue: could not start the Python worker for ${this.file}: ${err.message}`;
	}

	/**
	 * Records a startup failure, doubling the backoff on each repeat.
	 *
	 * @param error - The error every call is rejected with meanwhile.
	 */
	private recordStartupFailure(error: Error): void {
		const backoff = Math.min(
			(this.startupFailure?.backoff ?? BACKOFF_START / 2) * 2,
			BACKOFF_MAX,
		);

		this.startupFailure = {
			error,
			mtime: this.mtime(),
			until: Date.now() + backoff,
			backoff,
		};
	}

	/**
	 * Reads the file's modification time.
	 *
	 * @returns The mtime in milliseconds, or `-1` when the file cannot be read.
	 */
	private mtime(): number {
		try {
			return statSync(this.file).mtimeMs;
		} catch {
			return -1;
		}
	}

	/** Keeps Node alive only while a request is in flight. */
	private updateRef(): void {
		const child = this.child;

		if (!child) return;

		const busy = this.pending.size > 0;
		const handles = [
			child,
			child.stdin,
			child.stdout,
			child.stderr,
		] as unknown as RefHandle[];

		for (const handle of handles) {
			if (busy) handle.ref?.();
			else handle.unref?.();
		}
	}
}
