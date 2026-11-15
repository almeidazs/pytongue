/* pytongue */
/**
 * @remarks pytongue: `AsyncIterator` can only be returned by a generator, so it is typed as `unknown`.
 */
declare function a(): Promise<unknown>;
/**
 * @remarks pytongue: `AsyncIterable` can only be returned by a generator, so it is typed as `unknown`.
 */
declare function b(x: unknown): Promise<void>;
/**
 * @remarks pytongue: `AsyncGenerator` can only be returned by a generator, so it is typed as `unknown`.
 */
declare function c(): Promise<unknown>;
export { a, b, c };
export type { a as $py$a, b as $py$b, c as $py$c };
