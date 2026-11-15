/* pytongue */
declare function render(template: string, kwargs?: { escape?: boolean; }): Promise<string>;
export { render };
export type { render as $py$render };
