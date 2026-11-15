/* pytongue */
/**
 * Match paths such as src/*\/index.py.
 */
declare function glob(pattern: string): Promise<string[]>;
export { glob };
export type { glob as $py$glob };
