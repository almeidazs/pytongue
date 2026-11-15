/**
 * The uv command line that starts a worker.
 *
 * @module
 */
import { packageFile } from '@/shared';
import {
	BRIDGE_SCRIPT,
	DEFAULT_UV,
	PYDANTIC_REQUIREMENT,
	UV_ENV,
	type EnvSpec,
	type WorkerCommand,
} from '@/types/runtime';

/**
 * Builds the command that runs the worker for a file in its environment.
 *
 * @param file - The Python file's absolute path.
 * @param env - The environment to run it in.
 * @returns `uv run ... python bridge.py <file>`.
 */
export function workerCommand(file: string, env: EnvSpec): WorkerCommand {
	const command = process.env[UV_ENV] || DEFAULT_UV;
	const args = ['run', '--quiet'];

	if (env.kind === 'project') args.push('--project', env.root);
	else args.push('--no-project');

	if (env.kind === 'script' && env.requiresPython)
		args.push('--python', env.requiresPython);

	args.push('--with', PYDANTIC_REQUIREMENT);

	if (env.kind === 'script')
		for (const dep of env.dependencies) args.push('--with', dep);

	args.push('python', packageFile(BRIDGE_SCRIPT), file);

	return { command, args };
}
