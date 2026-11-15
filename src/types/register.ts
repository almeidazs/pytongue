/**
 * Types and constants of the runtime preload (`pytongue/register`).
 *
 * @module
 */

/** The module Bun's `onLoad` returns. */
export interface BunLoadResult {
	/** Always JavaScript. */
	loader: 'js';
	/** The module source. */
	contents: string;
}

/** The part of Bun's plugin builder the preload uses. */
export interface BunPluginBuilder {
	/**
	 * Registers a load callback.
	 *
	 * @param options - Which paths the callback handles.
	 * @param callback - Produces the module for a path.
	 */
	onLoad(
		options: { filter: RegExp },
		callback: (args: { path: string }) => BunLoadResult,
	): void;
}

/** A Bun plugin. */
export interface BunPlugin {
	/** The plugin name. */
	name: string;
	/**
	 * Registers the plugin's callbacks.
	 *
	 * @param build - The plugin builder.
	 */
	setup(build: BunPluginBuilder): void;
}

/** The part of the `Bun` global the preload uses. */
export interface BunGlobal {
	/**
	 * Registers a runtime plugin.
	 *
	 * @param plugin - The plugin.
	 */
	plugin(plugin: BunPlugin): void;
}

/** The global object, which has `Bun` under Bun. */
export interface BunHost {
	/** Bun's global, absent under Node. */
	Bun?: BunGlobal;
}

/** Paths the preload claims. */
export const PYTHON_FILE = /\.py$/;

/** The plugin name shown by Bun. */
export const PLUGIN_NAME = 'pytongue';
