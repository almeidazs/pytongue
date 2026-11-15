/**
 * Runs one benchmark cell in its own process group and collects its result lines.
 *
 * @module
 */
import { spawn } from 'node:child_process';
import { stripVTControlCharacters } from 'node:util';

import { MARK } from './shared.ts';
import type { ChildResult } from './types.ts';

/** How one cell ended. */
export type CellEnd =
	| { kind: 'result'; result: ChildResult; firstMs: number | undefined }
	| { kind: 'crash'; error: string }
	| { kind: 'timeout' };

/** What a cell needs to be launched. */
export interface CellSpec {
	command: string;
	args: string[];
	cwd: string;
	env: NodeJS.ProcessEnv;
	timeoutMs: number;
}

/** The process groups of the cells that are running, killed if the driver is interrupted. */
const running = new Set<number>();

/**
 * Kills a whole process group (the child, and the workers, servers and shells it started).
 *
 * @param pid - The group leader's pid.
 */
function killGroup(pid: number): void {
	try {
		process.kill(-pid, 'SIGKILL');
	} catch {
		// the group is already gone
	}
}

process.on('SIGINT', () => {
	for (const pid of running) killGroup(pid);

	process.exit(130);
});

/**
 * Appends output to a capture that keeps only the first 16 KB, where a crash explains itself.
 *
 * @param captured - What was kept so far.
 * @param more - New output.
 * @returns The extended capture.
 */
function capture(captured: string, more: string): string {
	return captured.length < 16_384 ? captured + more : captured;
}

/**
 * Picks the line that explains a crash out of a process's output: an error or panic line when
 * there is one, otherwise the first line with any text.
 *
 * @param output - The captured stderr and stdout.
 * @returns A single line, without colour codes.
 */
export function firstErrorLine(output: string): string | undefined {
	const lines = stripVTControlCharacters(output)
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean);
	const named = lines.find((line) =>
		/^(panic|error:|fatal|\w*error\b|uncaught)/i.test(line),
	);
	const mentioned = lines.find((line) => /\b(error|panic)\b/i.test(line));

	return named ?? mentioned ?? lines[0];
}

/**
 * Runs a cell until it exits or the timeout passes.
 *
 * @param spec - The command line, environment and timeout.
 * @returns The child's result lines, or why there are none.
 */
export function runCell(spec: CellSpec): Promise<CellEnd> {
	return new Promise((resolve) => {
		const start = performance.now();
		const child = spawn(spec.command, spec.args, {
			cwd: spec.cwd,
			env: spec.env,
			stdio: ['ignore', 'pipe', 'pipe'],
			detached: true,
		});
		const pid = child.pid;
		let result: ChildResult | undefined;
		let firstMs: number | undefined;
		let pendingLine = '';
		let head = '';
		let timedOut = false;

		if (pid !== undefined) running.add(pid);

		const timer = setTimeout(() => {
			timedOut = true;

			if (pid !== undefined) killGroup(pid);
		}, spec.timeoutMs);

		/**
		 * Handles one complete stdout line.
		 *
		 * @param line - The line, without its newline.
		 */
		const onLine = (line: string): void => {
			if (!line.startsWith(MARK)) {
				head = capture(head, line + '\n');

				return;
			}

			const message = JSON.parse(line.slice(MARK.length)) as
				| { event: string }
				| ChildResult;

			if ('event' in message) firstMs ??= performance.now() - start;
			else result = message;
		};

		child.stdout.setEncoding('utf8');
		child.stdout.on('data', (chunk: string) => {
			pendingLine += chunk;

			let newline = pendingLine.indexOf('\n');

			while (newline >= 0) {
				onLine(pendingLine.slice(0, newline));
				pendingLine = pendingLine.slice(newline + 1);
				newline = pendingLine.indexOf('\n');
			}
		});
		child.stderr.setEncoding('utf8');
		child.stderr.on('data', (chunk: string) => {
			head = capture(head, chunk);
		});
		child.on('error', (error) => {
			clearTimeout(timer);
			resolve({ kind: 'crash', error: error.message });
		});
		child.on('close', (code, signal) => {
			clearTimeout(timer);

			if (pid !== undefined) {
				running.delete(pid);
				killGroup(pid); // stray workers and servers
			}

			if (timedOut) return resolve({ kind: 'timeout' });

			if (result) return resolve({ kind: 'result', result, firstMs });

			const how = signal
				? `killed by ${signal}`
				: `exited with code ${code}`;

			resolve({
				kind: 'crash',
				error: firstErrorLine(head) ?? `process ${how} without output`,
			});
		});
	});
}
