/**
 * The real file system as an {@link AnalyzeHost}.
 *
 * @module
 */
import { readFileSync, statSync } from 'node:fs';

import type { AnalyzeHost } from '@/types/engine';

/** Resolves relative imports between `.py` files against the real file system. */
export const fsHost: AnalyzeHost = {
	fileExists(path) {
		try {
			return statSync(path).isFile();
		} catch {
			return false;
		}
	},
	readFile(path) {
		try {
			return readFileSync(path, 'utf8');
		} catch {
			return undefined;
		}
	},
};
