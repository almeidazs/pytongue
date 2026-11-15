/* pytongue */
declare function call(flags: { target: string; timeout?: number; [key: string]: boolean | string | number | undefined; }): Promise<void>;
export { call };
export type { call as $py$call };
