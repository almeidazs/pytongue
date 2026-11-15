/**
 * Small text helpers.
 *
 * @module
 */
import { IDENTIFIER } from '@/types/shared';

/**
 * Spells a property name, quoting it when it is not a plain identifier.
 *
 * @param name - The property name.
 * @returns The name, or its JSON string form.
 */
export function propertyName(name: string): string {
	return IDENTIFIER.test(name) ? name : JSON.stringify(name);
}

/**
 * Upper-cases the first character.
 *
 * @param text - Any text.
 * @returns The text with its first character upper-cased.
 */
export function capitalize(text: string): string {
	return text.charAt(0).toUpperCase() + text.slice(1);
}
