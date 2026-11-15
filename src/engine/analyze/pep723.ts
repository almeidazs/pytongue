/**
 * PEP 723 inline script metadata.
 *
 * @module
 */
import { PEP723_BLOCK } from '@/types/engine';

/**
 * Extracts the TOML of the `# /// script` block.
 *
 * @param source - The Python source text.
 * @returns The block's TOML with the comment markers removed, or `undefined` when there is none.
 */
export function scriptMetadata(source: string): string | undefined {
	const text = source.replace(/\r\n?/g, '\n');

	for (const match of text.matchAll(PEP723_BLOCK)) {
		if (match.groups!.type !== 'script') continue;

		return match
			.groups!.content!.split('\n')
			.map((line) =>
				line.startsWith('# ') ? line.slice(2) : line.slice(1),
			)
			.join('\n');
	}

	return undefined;
}
