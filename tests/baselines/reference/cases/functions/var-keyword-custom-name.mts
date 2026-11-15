/* pytongue */
declare function request(url: string, opts?: { timeout?: number; [key: string]: string | number | undefined; }): Promise<void>;
export { request };
export type { request as $py$request };
