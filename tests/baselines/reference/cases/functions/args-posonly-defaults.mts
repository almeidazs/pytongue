/* pytongue */
/**
 * @remarks pytongue: `int` values outside ±(2^53−1) cannot be represented in JavaScript and raise `PythonError` at runtime.
 */
declare function emit(event: string, level?: number): Promise<void>;
declare function emit(event: string, level: number, payload: string[]): Promise<void>;
export { emit };
export type { emit as $py$emit };
