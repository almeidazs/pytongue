/**
 * The content mapper process. TypeScript starts it (`tsc --runExternalCode`) through
 * `typescript.contentMapper.exec` in package.json and speaks JSON-RPC over stdio.
 *
 * @module
 */
import {
	runContentMapper,
	type OpenProjectParams,
	type OptionDiagnostic,
	type RunningContentMapper,
} from 'ts-content-mapper';

import { analyzePython } from '@/engine/analyze';
import { emitTypes } from '@/engine/emit/types';
import { fsHost, loadParser } from '@/engine/parser';
import {
	DIAGNOSTIC_SOURCE,
	MAPPER_OPTION_KEYS,
	OptionDiagnosticCode,
	type MapperOptions,
	type MapperProject,
	type OpenedProject,
} from '@/types';

/**
 * Validates the options of a `contentMappers` entry.
 *
 * @param options - The entry's `options`, as given.
 * @returns One diagnostic per unknown key or invalid value.
 */
function validateOptions(options: Record<string, unknown>): OptionDiagnostic[] {
	const diagnostics: OptionDiagnostic[] = [];

	for (const key of Object.keys(options))
		if (!MAPPER_OPTION_KEYS.has(key))
			diagnostics.push({
				path: [key],
				messageText: `Unknown pytongue option "${key}".`,
				code: OptionDiagnosticCode.UnknownOption,
			});

	if (options.strict !== undefined && typeof options.strict !== 'boolean')
		diagnostics.push({
			path: ['strict'],
			messageText: '"strict" must be a boolean.',
			code: OptionDiagnosticCode.InvalidStrict,
		});

	return diagnostics;
}

/**
 * Opens a project: reads its options into per-project state.
 *
 * @param params - The project TypeScript opens.
 * @returns The project state and any option diagnostics.
 */
function openProject(params: OpenProjectParams<MapperOptions>): OpenedProject {
	const options = (params.options ?? {}) as Record<string, unknown>;
	const optionDiagnostics = validateOptions(options);

	return {
		project: { strict: options.strict === true },
		...(optionDiagnostics.length ? { optionDiagnostics } : {}),
	};
}

/**
 * Starts the content mapper on stdin/stdout.
 *
 * @returns The running mapper.
 */
export function startMapper(): RunningContentMapper {
	const parserReady = loadParser();

	return runContentMapper<MapperOptions, MapperProject>({
		// No positionEncoding: the SDK picks UTF-16 when offered (web-tree-sitter's unit), and the
		// mapping builder converts if TypeScript only offers UTF-8.
		diagnosticSource: DIAGNOSTIC_SOURCE,
		openProject,
		async transform(params, context) {
			await parserReady;

			const info = analyzePython(params.content, params.fileName, fsHost);

			return emitTypes(info, params.content, {
				strict: context.project.strict,
				positionEncoding: context.positionEncoding,
			});
		},
	});
}
