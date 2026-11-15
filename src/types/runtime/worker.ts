/**
 * Types and constants of the worker process and its NDJSON protocol.
 *
 * @module
 */
import type { ChildProcessByStdio } from 'node:child_process';
import type { Readable, Writable } from 'node:stream';

import type { PythonErrorPayload } from './errors';

/** The worker child process, with piped stdin, stdout and stderr. */
export type WorkerChild = ChildProcessByStdio<Writable, Readable, Readable>;

/** A request waiting for its response. */
export interface PendingRequest {
	/**
	 * Settles the request with the worker's response.
	 *
	 * @param response - The decoded response line.
	 */
	resolve(response: WorkerResponse): void;
	/**
	 * Fails the request.
	 *
	 * @param error - Why it failed.
	 */
	reject(error: Error): void;
}

/** Callbacks that settle the ready promise. */
export interface ReadySignal {
	/** Marks the worker as ready. */
	resolve(): void;
	/**
	 * Marks the startup as failed.
	 *
	 * @param error - Why it failed.
	 */
	reject(error: Error): void;
}

/** A module import failure, which blocks respawning until the file changes or the backoff passes. */
export interface StartupFailure {
	/** The error every call is rejected with meanwhile. */
	error: Error;
	/** The file's mtime when it failed. */
	mtime: number;
	/** Epoch milliseconds after which a respawn is allowed. */
	until: number;
	/** The current backoff in milliseconds. */
	backoff: number;
}

/** The first line the worker sends, after importing the module. */
export interface ReadyMessage {
	/** Whether the module imported. */
	ready: boolean;
	/** The import error, when `ready` is false. */
	error?: PythonErrorPayload;
}

/** A response to a request. */
export interface WorkerResponse {
	/** The request id. */
	id: number;
	/** Whether the request succeeded. */
	ok: boolean;
	/** The serialized result of a call or of a stream item. */
	value?: unknown;
	/** For `next`: whether the stream is exhausted. */
	done?: boolean;
	/** The error, when `ok` is false. */
	error?: PythonErrorPayload;
}

/** Any line the worker sends. */
export type WorkerMessage = ReadyMessage | WorkerResponse;

/** A request or notification sent to the worker (the id is added by the worker process). */
export interface WorkerRequest {
	/** The operation. */
	op: 'call' | 'open' | 'next' | 'cancel';
	/** Further fields of the operation. */
	[field: string]: unknown;
}

/** Whether the current worker completed its ready handshake. */
export interface StartupState {
	/** `true` once the module imported. */
	isReady: boolean;
}

/** A Node handle that can stop keeping the event loop alive. */
export interface RefHandle {
	/** Keeps the event loop alive while the handle is open. */
	ref?(): void;
	/** Lets the event loop exit even if the handle is open. */
	unref?(): void;
}

/** How much of the worker's stderr is kept for error messages, in characters. */
export const STDERR_TAIL = 8192;

/** The first backoff after a startup failure, in milliseconds. */
export const BACKOFF_START = 2_000;

/** The longest backoff after repeated startup failures, in milliseconds. */
export const BACKOFF_MAX = 60_000;
