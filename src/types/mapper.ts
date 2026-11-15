/**
 * Types and constants of the content mapper process.
 *
 * @module
 */
import type { OpenProjectResult } from 'ts-content-mapper';

/** Options accepted in the `contentMappers` entry of `tsconfig.json`. */
export interface MapperOptions {
	/** Report every `unknown` (missing or untranslatable hint) as an error at its Python span. */
	strict?: boolean;
}

/** Per-project state kept by the mapper. */
export interface MapperProject {
	/** Whether strict mode is on for this project. */
	strict: boolean;
}

/** What `openProject` returns: TypeScript's result plus the mapper's own project state. */
export interface OpenedProject extends OpenProjectResult {
	/** The per-project state, kept by the SDK and never sent to TypeScript. */
	project: MapperProject;
}

/** The option keys the mapper understands. */
export const MAPPER_OPTION_KEYS: ReadonlySet<string> = new Set(['strict']);

/** Codes of option diagnostics. */
export const OptionDiagnosticCode = {
	/** An option key the mapper does not know. */
	UnknownOption: 2001,
	/** `strict` is not a boolean. */
	InvalidStrict: 2002,
} as const;

/** The diagnostic source TypeScript prefixes mapper codes with. */
export const DIAGNOSTIC_SOURCE = 'pytongue';
