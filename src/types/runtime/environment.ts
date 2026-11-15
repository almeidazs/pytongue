/**
 * How the worker's Python environment is built.
 *
 * @module
 */

/** The file has a PEP 723 `# /// script` block. */
export interface ScriptEnvironment {
	/** Discriminant. */
	kind: 'script';
	/** The `requires-python` specifier, if any. */
	requiresPython?: string;
	/** The `dependencies` requirement strings. */
	dependencies: string[];
}

/** No PEP 723 block, but a `pyproject.toml` up the tree. */
export interface ProjectEnvironment {
	/** Discriminant. */
	kind: 'project';
	/** The directory holding `pyproject.toml`. */
	root: string;
}

/** Neither: an isolated environment with Pydantic only. */
export interface IsolatedEnvironment {
	/** Discriminant. */
	kind: 'isolated';
}

/** How to build the worker's Python environment; decided by the loader from the `.py` file. */
export type EnvSpec =
	| ScriptEnvironment
	| ProjectEnvironment
	| IsolatedEnvironment;

/** A command line to start the worker. */
export interface WorkerCommand {
	/** The executable (uv). */
	command: string;
	/** Its arguments. */
	args: string[];
}

/** The environment variable that overrides the uv binary. */
export const UV_ENV = 'PYTONGUE_UV';

/** The uv binary used when {@link UV_ENV} is not set. */
export const DEFAULT_UV = 'uv';

/** The Pydantic requirement added to every worker environment. */
export const PYDANTIC_REQUIREMENT = 'pydantic>=2';

/** Where uv's installation guide lives, for the "uv not found" error. */
export const UV_INSTALL_URL =
	'https://docs.astral.sh/uv/getting-started/installation/';

/** The worker entry script, relative to the package root. */
export const BRIDGE_SCRIPT = 'python/bridge.py';
