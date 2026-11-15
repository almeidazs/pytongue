/**
 * Entry point of the runtime preload: `node --import pytongue/register` or
 * `bun --preload pytongue/register`.
 *
 * @module
 */
import { installHooks } from '@/register';

await installHooks();
