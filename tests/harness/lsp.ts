/**
 * A minimal LSP client over stdio for TypeScript 7.1's language server (`tsc --lsp --stdio`),
 * with content mappers enabled. Only what the tests need: documents, hover, definition,
 * references and pull diagnostics.
 *
 * @module
 */
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { ROOT } from '../helpers';

/** A zero-based LSP position. */
export interface Position {
	/** Zero-based line. */
	line: number;
	/** Zero-based UTF-16 column. */
	character: number;
}

/** An LSP range. */
export interface Range {
	/** Start. */
	start: Position;
	/** End. */
	end: Position;
}

/** An LSP location. */
export interface Location {
	/** The document URI. */
	uri: string;
	/** The range in it. */
	range: Range;
}

/** An LSP diagnostic. */
export interface LspDiagnostic {
	/** The range. */
	range: Range;
	/** The message. */
	message: string;
	/** The code. */
	code?: number | string;
	/** The source, such as `ts` or `pytongue`. */
	source?: string;
}

/** The TypeScript 7.1 binary of this repository. */
const TSC = join(ROOT, 'node_modules/@typescript/typescript-linux-x64/lib/tsc');

type Handler = (message: {
	id?: number;
	method?: string;
	params?: unknown;
	result?: unknown;
	error?: unknown;
}) => void;

/** A running language server. */
export class LspClient {
	private readonly child: ChildProcessWithoutNullStreams;
	private buffer = Buffer.alloc(0);
	private nextId = 0;
	private readonly pending = new Map<
		number,
		(message: Parameters<Handler>[0]) => void
	>();

	/**
	 * Starts the server for a project directory and initializes it.
	 *
	 * @param root - The project directory (holds the tsconfig).
	 */
	constructor(private readonly root: string) {
		this.child = spawn(TSC, ['--lsp', '--stdio'], { cwd: root });
		this.child.stdout.on('data', (chunk: Buffer) => this.onData(chunk));
		this.child.stderr.on('data', () => {});
	}

	/**
	 * Completes the LSP handshake.
	 *
	 * @returns This client.
	 */
	async initialize(): Promise<this> {
		await this.request('initialize', {
			processId: process.pid,
			rootUri: pathToFileURL(this.root).href,
			workspaceFolders: [
				{ uri: pathToFileURL(this.root).href, name: 'test' },
			],
			initializationOptions: { runExternalCode: true },
			capabilities: {
				workspace: { configuration: true },
				textDocument: {
					hover: { contentFormat: ['markdown', 'plaintext'] },
					diagnostic: {},
					definition: { linkSupport: false },
				},
			},
		});
		this.notify('initialized', {});

		return this;
	}

	/**
	 * The URI of a file in the project.
	 *
	 * @param file - A path relative to the project.
	 * @returns A `file://` URI.
	 */
	uri(file: string): string {
		return pathToFileURL(join(this.root, file)).href;
	}

	/**
	 * Opens a document, as an editor does.
	 *
	 * @param file - A path relative to the project.
	 * @param text - The document text.
	 * @param languageId - The language id.
	 */
	open(file: string, text: string, languageId: string): void {
		this.notify('textDocument/didOpen', {
			textDocument: { uri: this.uri(file), languageId, version: 1, text },
		});
	}

	/**
	 * Replaces a document's text, as typing does.
	 *
	 * @param file - A path relative to the project.
	 * @param text - The new text.
	 * @param version - A version number greater than the last one.
	 */
	change(file: string, text: string, version: number): void {
		this.notify('textDocument/didChange', {
			textDocument: { uri: this.uri(file), version },
			contentChanges: [{ text }],
		});
	}

	/**
	 * Asks for hover text.
	 *
	 * @param file - A path relative to the project.
	 * @param position - The position.
	 * @returns The hover contents as plain text, or `undefined` when there is none.
	 */
	async hover(file: string, position: Position): Promise<string | undefined> {
		const result = (await this.request('textDocument/hover', {
			textDocument: { uri: this.uri(file) },
			position,
		})) as { contents?: { value?: string } | string } | null;

		if (!result?.contents) return undefined;

		return typeof result.contents === 'string'
			? result.contents
			: result.contents.value;
	}

	/**
	 * Asks for definitions.
	 *
	 * @param file - A path relative to the project.
	 * @param position - The position.
	 * @returns The locations.
	 */
	async definition(file: string, position: Position): Promise<Location[]> {
		const result = (await this.request('textDocument/definition', {
			textDocument: { uri: this.uri(file) },
			position,
		})) as Location | Location[] | null;

		if (!result) return [];

		return Array.isArray(result) ? result : [result];
	}

	/**
	 * Asks for references.
	 *
	 * @param file - A path relative to the project.
	 * @param position - The position.
	 * @returns The locations, declaration included.
	 */
	async references(file: string, position: Position): Promise<Location[]> {
		const result = (await this.request('textDocument/references', {
			textDocument: { uri: this.uri(file) },
			position,
			context: { includeDeclaration: true },
		})) as Location[] | null;

		return result ?? [];
	}

	/**
	 * Pulls a document's diagnostics.
	 *
	 * @param file - A path relative to the project.
	 * @returns The diagnostics.
	 */
	async diagnostics(file: string): Promise<LspDiagnostic[]> {
		const result = (await this.request('textDocument/diagnostic', {
			textDocument: { uri: this.uri(file) },
		})) as { items?: LspDiagnostic[] } | null;

		return result?.items ?? [];
	}

	/** Shuts the server down. */
	async close(): Promise<void> {
		try {
			await this.request('shutdown');
			this.notify('exit');
		} finally {
			this.child.kill();
		}
	}

	/**
	 * Sends a request and waits for its response.
	 *
	 * @param method - The LSP method.
	 * @param params - The parameters.
	 * @returns The result.
	 * @throws {Error} When the server answers with an error.
	 */
	private request(method: string, params?: unknown): Promise<unknown> {
		const id = ++this.nextId;

		return new Promise((resolve, reject) => {
			const timeout = setTimeout(() => {
				this.pending.delete(id);
				reject(new Error(`LSP request ${method} timed out`));
			}, 60_000);

			this.pending.set(id, (message) => {
				clearTimeout(timeout);

				if (message.error)
					reject(
						new Error(
							`${method}: ${JSON.stringify(message.error)}`,
						),
					);
				else resolve(message.result);
			});
			this.send({ jsonrpc: '2.0', id, method, params });
		});
	}

	/**
	 * Sends a notification.
	 *
	 * @param method - The LSP method.
	 * @param params - The parameters.
	 */
	private notify(method: string, params?: unknown): void {
		this.send({ jsonrpc: '2.0', method, params });
	}

	/**
	 * Writes one framed message.
	 *
	 * @param message - The JSON-RPC message.
	 */
	private send(message: object): void {
		const body = JSON.stringify(message);

		this.child.stdin.write(
			`Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`,
		);
	}

	/**
	 * Parses framed messages out of the stdout stream and dispatches them.
	 *
	 * @param chunk - Newly received bytes.
	 */
	private onData(chunk: Buffer): void {
		this.buffer = Buffer.concat([this.buffer, chunk]);

		for (;;) {
			const end = this.buffer.indexOf('\r\n\r\n');

			if (end < 0) return;

			const length = Number(
				/Content-Length: (\d+)/i.exec(
					this.buffer.subarray(0, end).toString(),
				)?.[1],
			);

			if (this.buffer.length < end + 4 + length) return;

			const message = JSON.parse(
				this.buffer.subarray(end + 4, end + 4 + length).toString(),
			);

			this.buffer = this.buffer.subarray(end + 4 + length);
			this.dispatch(message);
		}
	}

	/**
	 * Routes a message: responses to their request, server requests get an empty answer.
	 *
	 * @param message - The decoded message.
	 */
	private dispatch(message: Parameters<Handler>[0]): void {
		if (message.id !== undefined && !message.method) {
			this.pending.get(message.id)?.(message);
			this.pending.delete(message.id);

			return;
		}

		if (message.id === undefined) return;

		// A request from the server (`workspace/configuration`, `client/registerCapability`).
		const result =
			message.method === 'workspace/configuration'
				? (message.params as { items: unknown[] }).items.map(() => ({}))
				: null;

		this.send({ jsonrpc: '2.0', id: message.id, result });
	}
}
