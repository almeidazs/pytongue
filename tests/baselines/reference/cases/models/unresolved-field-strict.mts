/* pytongue */
/**
 * @remarks pytongue: cannot resolve `Figure`, so it is typed as `unknown`.
 */
interface Report {
  chart: unknown;
}
declare namespace Report {
  type Input = Report;
}
export type { Report };
export {};
export type { Report as $py$Report };
