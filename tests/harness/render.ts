/**
 * Renders mapper output as readable baseline text.
 *
 * @module
 */
import type { ContentMapperDiagnostic, SpanMapping } from 'ts-content-mapper';

import { MAPPED_FEATURES } from '@/types/engine';

const KINDS = ['verbatim', 'atom', 'alias'];

const FEATURE_NAMES: [number, string][] = [
	[1, 'hover'],
	[2, 'signature'],
	[4, 'completion'],
	[8, 'definition'],
	[16, 'type-definition'],
	[32, 'implementation'],
	[64, 'references'],
	[128, 'highlights'],
	[256, 'rename'],
];

/**
 * Converts a UTF-16 offset to a 1-based `line:column`.
 *
 * @param text - The text the offset points into.
 * @param offset - The offset.
 * @returns The position.
 */
export function position(text: string, offset: number): string {
	const before = text.slice(0, offset);
	const line = before.split('\n').length;
	const column = offset - before.lastIndexOf('\n');

	return `${line}:${column}`;
}

/**
 * Renders diagnostics like `tsc` does: `file(line,col): error code: message`.
 *
 * @param file - The file name to print.
 * @param source - The Python source.
 * @param diagnostics - The mapper's diagnostics.
 * @returns One line per diagnostic, or a note that there are none.
 */
export function renderDiagnostics(
	file: string,
	source: string,
	diagnostics: ContentMapperDiagnostic[] | undefined,
): string {
	if (!diagnostics?.length) return '(no diagnostics)\n';

	return diagnostics
		.map((d) => {
			const at = position(source, d.start).replace(':', ',');
			const text = JSON.stringify(
				source.slice(d.start, d.start + d.length),
			);

			return `${file}(${at}): error pytongue${d.code}: ${d.messageText}\n    at ${text}`;
		})
		.join('\n')
		.concat('\n');
}

/**
 * Names the features of a mapping, or nothing for pytongue's default set.
 *
 * @param features - The feature bits (`undefined` means all).
 * @returns A suffix such as ` [definition]`.
 */
function featureNames(features: number | undefined): string {
	if (features === MAPPED_FEATURES) return '';

	if (features === undefined) return ' [all]';

	const names = FEATURE_NAMES.filter(([bit]) => features & bit).map(
		([, name]) => name,
	);

	return ` [${names.join(', ') || 'none'}]`;
}

/**
 * Renders each mapping as `ts line:col "text" → py line:col "text" kind`.
 *
 * @param virtual - The emitted TypeScript.
 * @param source - The Python source.
 * @param mappings - The span mappings.
 * @returns One line per mapping.
 */
export function renderMappings(
	virtual: string,
	source: string,
	mappings: readonly SpanMapping[] | undefined,
): string {
	if (!mappings?.length) return '(no mappings)\n';

	return mappings
		.map(([vStart, vLength, oStart, oLength, kind, features]) => {
			const ts = JSON.stringify(virtual.slice(vStart, vStart + vLength));
			const py = JSON.stringify(source.slice(oStart, oStart + oLength));

			return `ts ${position(virtual, vStart)} ${ts} → py ${position(source, oStart)} ${py} ${KINDS[kind]}${featureNames(features)}`;
		})
		.join('\n')
		.concat('\n');
}
