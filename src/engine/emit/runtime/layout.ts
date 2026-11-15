/**
 * The call layout of a Python function, shared by the generated module and the worker client.
 *
 * @module
 */
import { analyzePython } from '@/engine/analyze';
import type { AnalyzeHost, FunctionInfo } from '@/types/engine';
import { GENERIC_LAYOUT, type Layout } from '@/types/runtime';

/**
 * Computes how JavaScript arguments map onto a Python function.
 *
 * @param info - The analyzed function.
 * @returns Its call layout; it matches the TypeScript signature the mapper emits.
 */
export function layoutOf(info: FunctionInfo): Layout {
	const { params } = info;

	return {
		req: params.filter(
			(p) =>
				(p.kind === 'normal' || p.kind === 'positional-only') &&
				!p.hasDefault,
		).length,
		opt: params
			.filter((p) => p.kind === 'positional-only' && p.hasDefault)
			.map((p) => p.name),
		rest: params.some((p) => p.kind === 'var-positional'),
		kw: params.some(
			(p) =>
				(p.kind === 'normal' && p.hasDefault) ||
				p.kind === 'keyword-only' ||
				p.kind === 'var-keyword',
		),
		gen: info.isGenerator,
		void:
			!info.isGenerator &&
			info.returns.kind === 'keyword' &&
			info.returns.ts === 'void',
	};
}

/**
 * Computes the layout of a function defined in another file and re-exported via `__all__`.
 *
 * @param file - The other file's absolute path.
 * @param name - The function name there.
 * @param host - File access.
 * @returns Its layout, or the generic all-positional layout when it cannot be found.
 */
export function reexportLayout(
	file: string,
	name: string,
	host: AnalyzeHost,
): Layout {
	const source = host.readFile(file);
	const info =
		source === undefined
			? undefined
			: analyzePython(source, file, host).functions.find(
					(f) => f.name === name,
				);

	return info ? layoutOf(info) : { ...GENERIC_LAYOUT };
}
