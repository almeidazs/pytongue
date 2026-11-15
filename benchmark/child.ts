import * as scenarios from './scenarios.ts';
import { emit } from './shared.ts';
/**
 * One benchmark cell: `<runtime> child.ts <tool> <scenario> [--quick]`.
 *
 * Opens the tool, runs one scenario and prints the result as `@@RESULT@@ {json}` lines for the
 * driver. A crash of the runtime leaves no result line, which the driver reports as a failure.
 *
 * @module
 */
import { adapters } from './tools/index.ts';
import type { ColdResult, Session } from './types.ts';

/**
 * Runs the requested scenario against an open session.
 *
 * @param id - The tool id.
 * @param scenario - The scenario id.
 * @param quick - Whether to use the reduced iteration counts.
 */
async function main(
	id: string,
	scenario: string,
	quick: boolean,
): Promise<void> {
	const adapter = adapters.find((candidate) => candidate.id === id);

	if (!adapter) throw new Error(`unknown tool ${id}`);

	let session: Session | undefined;
	let stage = 'open';

	try {
		const start = performance.now();

		session = await adapter.open();
		stage = 'first call';

		const first = await session.add(1, 2);

		if (first !== 3) throw new Error(`add(1, 2) returned ${String(first)}`);

		const clientMs = performance.now() - start;

		await emit({ event: 'first' });
		stage = scenario;

		let data: unknown;

		if (scenario === 'cold') {
			data = { clientMs, info: session.info } satisfies ColdResult;
		} else if (scenario === 'latency') {
			data = await scenarios.latency(adapter, session, quick);
		} else if (scenario === 'throughput') {
			data = await scenarios.throughput(adapter, session, quick);
		} else if (scenario === 'payload') {
			data = await scenarios.payload(adapter, session, quick);
		} else if (scenario === 'cpu') {
			data = await scenarios.cpu(session, quick);
		} else {
			throw new Error(`unknown scenario ${scenario}`);
		}

		await emit({ status: 'ok', data });
	} catch (error) {
		const text =
			error instanceof Error
				? `${error.name}: ${error.message}`
				: String(error);

		await emit({ status: 'fail', stage, error: text });
	}

	// A tool that cannot shut down must not hang the cell: the driver kills the process group.
	await Promise.race([
		session?.close().catch(() => {}),
		new Promise((resolve) => setTimeout(resolve, 3000)),
	]);
	process.exit(0);
}

const [id = '', scenario = ''] = process.argv.slice(2);

await main(id, scenario, process.argv.includes('--quick'));
