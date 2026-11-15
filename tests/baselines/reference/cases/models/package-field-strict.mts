/* pytongue */
/**
 * @remarks pytongue: `numpy.ndarray` comes from the module `numpy`, so it is typed as `unknown`.
 */
interface Sample {
  data: unknown;
}
declare namespace Sample {
  type Input = Sample;
}
export type { Sample };
export {};
export type { Sample as $py$Sample };
