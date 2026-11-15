/**
 * Every tool of the benchmark, in report order. The modules import their libraries lazily, so
 * the driver can load this list without installing anything.
 *
 * @module
 */
import type { Adapter } from '../types.ts';
import fastapi from './fastapi.ts';
import pymport from './pymport.ts';
import pyodide from './pyodide.ts';
import pythonShell from './python-shell.ts';
import pythonia from './pythonia.ts';
import pytongueRaw from './pytongue-raw.ts';
import pytongue from './pytongue.ts';
import spawnPerCall from './spawn-per-call.ts';

/** The adapters of the JavaScript tools (native Python is measured by `python/native.py`). */
export const adapters: Adapter[] = [
	pytongue,
	pytongueRaw,
	pythonShell,
	pythonia,
	pymport,
	pyodide,
	spawnPerCall,
	fastapi,
];
