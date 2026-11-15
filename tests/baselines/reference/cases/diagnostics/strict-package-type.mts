/* pytongue */
/**
 * @remarks pytongue: `numpy.ndarray` comes from the module `numpy`, so it is typed as `unknown`.
 * @remarks pytongue: `pandas.DataFrame` comes from the module `pandas`, so it is typed as `unknown`.
 */
declare function summarize(values: unknown, frame: unknown): Promise<string>;
export { summarize };
export type { summarize as $py$summarize };
