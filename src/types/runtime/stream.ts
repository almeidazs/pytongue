/**
 * Types and constants of generator streams.
 *
 * @module
 */

/** A mutable flag shared between a stream and its finalizer. */
export interface ClosedFlag {
	/** Whether the stream is closed. */
	value: boolean;
}

/** What the finalizer needs to cancel a stream whose iterator was dropped. */
export interface AbandonedStream {
	/**
	 * Sends the cancel notification.
	 *
	 * @param stream - The stream id.
	 */
	cancel(stream: number): void;
	/** The stream id. */
	stream: number;
	/** Whether the stream was already closed. */
	closed: ClosedFlag;
}

/** The environment variable that sets how many items are requested ahead. */
export const PREFETCH_ENV = 'PYTONGUE_PREFETCH';

/** Items requested ahead when {@link PREFETCH_ENV} is not set. */
export const DEFAULT_PREFETCH = 1;
