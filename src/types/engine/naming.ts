/**
 * How Python names are spelled in TypeScript.
 *
 * @module
 */

/**
 * Prefix of the cross-file type surface (`$py$Name`). `$` never occurs in a Python identifier,
 * so surface names cannot collide with user names.
 */
export const SURFACE_PREFIX = '$py$';
