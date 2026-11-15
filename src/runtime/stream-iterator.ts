/**
 * Python generators as JavaScript async iterators: pulled one item at a time, with a bounded
 * prefetch, and closed on `break`, on `return()` or when the iterator is garbage-collected.
 *
 * @module
 */
import {
	DEFAULT_PREFETCH,
	PREFETCH_ENV,
	type AbandonedStream,
	type ClosedFlag,
	type Wire,
	type WorkerResponse,
} from '@/types/runtime';

import type { WorkerProcess } from './worker-process';

/** Requests kept in flight, the one being awaited included. */
const prefetch = Math.max(
	1,
	Number.parseInt(
		process.env[PREFETCH_ENV] ?? String(DEFAULT_PREFETCH),
		10,
	) || DEFAULT_PREFETCH,
);

/** Cancels streams whose iterators were dropped without `break` or `return()`. */
const abandoned = new FinalizationRegistry<AbandonedStream>((held) => {
	if (!held.closed.value) held.cancel(held.stream);
});

let streamIds = 0;

/** Iterates one call of a Python generator. */
export class StreamIterator implements AsyncIterator<unknown> {
	private readonly stream = ++streamIds;
	private readonly closed: ClosedFlag = { value: false };
	private readonly queue: Promise<IteratorResult<unknown>>[] = [];
	private opened: Promise<void> | undefined;
	private done = false;

	/**
	 * Creates an iterator; the generator is opened lazily, on the first `next()`.
	 *
	 * @param worker - The worker of the generator's file.
	 * @param fn - The generator function name.
	 * @param wire - The encoded call arguments.
	 */
	constructor(
		private readonly worker: WorkerProcess,
		private readonly fn: string,
		private readonly wire: Wire,
	) {
		const { stream, closed } = this;

		abandoned.register(this, {
			cancel: (id) => worker.notify({ op: 'cancel', stream: id }),
			stream,
			closed,
		});
	}

	/**
	 * Takes the next item, keeping up to `PYTONGUE_PREFETCH` requests in flight.
	 *
	 * @returns The next item, or `done` once the generator is exhausted or closed.
	 * @throws {PythonError} When the generator raised.
	 */
	next(): Promise<IteratorResult<unknown>> {
		if (this.closed.value && !this.queue.length)
			return Promise.resolve({ done: true, value: undefined });

		if (!this.queue.length) this.pull();

		const item = this.queue.shift()!;

		if (!this.done && !this.closed.value)
			for (let ahead = this.queue.length; ahead < prefetch - 1; ahead++)
				this.pull();

		return item.catch((error: unknown) => {
			this.closed.value = true;
			this.queue.length = 0;

			throw error;
		});
	}

	/**
	 * Closes the Python generator (`close()` / `aclose()`), as `break` does.
	 *
	 * @param value - Returned as the final result.
	 * @returns A `done` result.
	 */
	async return(value?: unknown): Promise<IteratorResult<unknown>> {
		if (!this.closed.value) {
			this.closed.value = true;

			if (this.opened)
				this.worker.notify({ op: 'cancel', stream: this.stream });
		}

		this.queue.length = 0;

		return { done: true, value };
	}

	/**
	 * Closes the generator, then rethrows.
	 *
	 * @param error - The error to rethrow.
	 * @returns Never; always throws.
	 * @throws {unknown} The given error.
	 */
	async throw(error?: unknown): Promise<IteratorResult<unknown>> {
		await this.return();

		throw error;
	}

	/** Requests one more item, opening the generator first if needed. */
	private pull(): void {
		this.opened ??= this.worker
			.request({
				op: 'open',
				stream: this.stream,
				fn: this.fn,
				...this.wire,
			})
			.then(() => {});

		const item = this.opened
			.then(() =>
				this.worker.request({ op: 'next', stream: this.stream }),
			)
			.then((response) => this.toResult(response));

		item.catch(() => {}); // surfaced by the next() that takes it
		this.queue.push(item);
	}

	/**
	 * Turns a `next` response into an iterator result.
	 *
	 * @param response - The worker's response.
	 * @returns The item, or `done` (which also marks the stream closed).
	 */
	private toResult(response: WorkerResponse): IteratorResult<unknown> {
		if (response.done) {
			this.done = true;
			this.closed.value = true;

			return { done: true, value: undefined };
		}

		return { done: false, value: response.value };
	}
}
