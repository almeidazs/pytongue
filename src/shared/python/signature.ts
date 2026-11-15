/**
 * How a Python parameter is passed from TypeScript. The emitted signature and the runtime call
 * layout both decide it here, so they cannot disagree.
 *
 * @module
 */
import type { Param } from '@/types/engine';

/**
 * Tells whether a function has `*args`.
 *
 * @param params - The function's parameters.
 * @returns `true` when one of them is `*args`.
 */
export function hasVarPositional(params: Param[]): boolean {
	return params.some((p) => p.kind === 'var-positional');
}

/**
 * Tells whether a parameter is a required positional argument.
 *
 * @param param - A parameter.
 * @returns `true` for a parameter without a default that can be passed by position.
 */
export function isRequiredPositional(param: Param): boolean {
	return (
		(param.kind === 'normal' || param.kind === 'positional-only') &&
		!param.hasDefault
	);
}

/**
 * Tells whether a parameter is an optional positional argument. Positional-only parameters with
 * a default always are. So are normal parameters with a default when the function has `*args`:
 * Python can only reach `*args` by passing them by position.
 *
 * @param param - A parameter.
 * @param varPositional - Whether the function has `*args`.
 * @returns `true` when the parameter is passed by position and may be left out.
 */
export function isOptionalPositional(
	param: Param,
	varPositional: boolean,
): boolean {
	if (!param.hasDefault) return false;

	return (
		param.kind === 'positional-only' ||
		(varPositional && param.kind === 'normal')
	);
}

/**
 * Tells whether a parameter goes into the trailing keyword-arguments object: keyword-only
 * parameters, and normal parameters with a default when they are not passed positionally.
 *
 * @param param - A parameter.
 * @param varPositional - Whether the function has `*args`.
 * @returns `true` when the parameter is passed by keyword.
 */
export function isKeywordField(param: Param, varPositional: boolean): boolean {
	if (param.kind === 'keyword-only') return true;

	return param.kind === 'normal' && param.hasDefault && !varPositional;
}
